const uuid = require('uuid');
const pick = require('lodash/pick');
const isFunction = require('lodash/isFunction');
const isArray = require('lodash/isArray');
const { createMachine, assign } = require('xstate');

const { createApiUrl, createDeepLink, createSocketEndpoint, doSignedRequest, getUpdater } = require('./util');
const { createConnection, destroyConnections } = require('./socket');

const noop = () => undefined;
const debug = console.log;
const DEFAULT_TIMEOUT = {
  START_TIMEOUT: 10 * 1000, // webapp-callback
  CREATE_TIMEOUT: 10 * 1000, // relay-server
  WALLET_SCAN_TIMEOUT: 60 * 1000, // user-wallet
  WALLET_CONNECT_TIMEOUT: 60 * 1000, // user-wallet
  WALLET_APPROVE_TIMEOUT: 60 * 1000, // user-wallet
  APP_CONNECT_TIMEOUT: 20 * 1000, // webapp-callback
  APP_APPROVE_TIMEOUT: 20 * 1000, // webapp-callback
};

/**
 * Create a new did connect session state machine
 *
 * @param {object} {
 *   baseUrl = '/api/connect/relay',
 *   initial = 'start', // we maybe reusing existing session
 *   sessionId, // we maybe reusing existing session
 *   strategy = 'default',
 *   dispatch, // handle events emitted from websocket relay
 *   onStart = noop,
 *   onCreate = noop,
 *   onConnect,
 *   onApprove,
 *   onComplete = noop,
 *   onReject = noop,
 *   onCancel = noop,
 *   onTimeout = noop,
 *   onError = noop,
 *   timeout = DEFAULT_TIMEOUT,
 * }
 * @return {object} xstate machine instance
 */
const createStateMachine = ({
  baseUrl = '/api/connect/relay',
  initial = 'start', // we maybe reusing existing session
  sessionId, // we maybe reusing existing session
  strategy = 'default',
  dispatch, // handle events emitted from websocket relay
  onStart = noop,
  onCreate = noop,
  onConnect,
  onApprove,
  onComplete = noop,
  onReject = noop,
  onCancel = noop,
  onTimeout = noop,
  onError = noop,
  autoConnect = true,
  timeout = DEFAULT_TIMEOUT,
}) => {
  if (sessionId && uuid.validate(sessionId) === false) {
    throw new Error('Invalid sessionId, which must be a valid uuid.v4');
  }

  const fns = { dispatch, onStart, onCreate, onApprove, onComplete, onReject, onCancel, onTimeout, onError };
  Object.keys(fns).forEach((x) => {
    if (isFunction(fns[x]) === false) {
      throw new Error(`Invalid ${x}, which must be a function`);
    }
  });

  // can be claim list or function that returns claim list
  if (isFunction(onConnect) === false && isArray(onConnect) === false) {
    throw new Error('Invalid onConnect, which must be a function or an object or an array');
  }

  let requestedClaims = [];
  if (typeof onConnect !== 'function') {
    requestedClaims = onConnect;
  }

  const updater = getUpdater();
  const sid = sessionId || uuid.v4();
  const pk = updater.publicKey;

  const authApiUrl = createApiUrl(baseUrl, sid, '/auth');
  const sessionApiUrl = createApiUrl(baseUrl, sid, '/session');

  const _onStart = async (ctx, e) => {
    await onStart(ctx, e);
  };

  const _createOrRestoreSession = async (ctx, e) => {
    const isExistingSession = sessionId === sid;
    if (isExistingSession) {
      // FIXME: Reuse existing session
    } else {
      // Create new session
      const result = await doSignedRequest({
        url: sessionApiUrl,
        data: { sessionId: sid, updaterPk: pk, requestedClaims, autoConnect, authUrl: authApiUrl },
        wallet: updater,
        method: 'POST',
      });
      await onCreate(ctx, e);
      return result.appInfo;
    }
  };

  const _onConnect = async (ctx, e) => {
    if (ctx.requestedClaims.length) {
      return ctx.requestedClaims;
    }

    // FIXME: validation here before send to remote
    const claims = await onConnect(ctx, e);
    const result = await doSignedRequest({
      url: sessionApiUrl,
      data: { requestedClaims: claims },
      wallet: updater,
      method: 'PUT',
    });
    return result.requestedClaims;
  };

  const _onApprove = async (ctx, e) => {
    let approveResult = await onApprove(ctx, e);
    if (typeof approveResult === 'undefined') {
      approveResult = null;
    }

    debug('_onApprove', e, approveResult);
    await doSignedRequest({
      url: sessionApiUrl,
      data: { approveResults: [...ctx.approveResults, approveResult] },
      wallet: updater,
      method: 'PUT',
    });
    return approveResult;
  };

  const _onComplete = async (...args) => {
    await onComplete(...args);
  };

  const _onReject = async (...args) => {
    await onReject(...args);
  };

  const _onTimeout = async (...args) => {
    debug('_onTimeout', ...args);
    await onTimeout(...args);
  };

  const _onCancel = async (...args) => {
    debug('_onCancel', ...args);
    await onCancel(...args);
  };

  const _onError = async (ctx, e) => {
    // report client error to relay, and execute callback
    if (e.data) {
      console.error(e.data);
      await doSignedRequest({
        url: sessionApiUrl,
        data: { status: 'error', error: e.data.message },
        wallet: updater,
        method: 'PUT',
      });
    }
    await onError(ctx, e);
  };

  // TODO: fallback to polling when socket connection failed
  createConnection(createSocketEndpoint(baseUrl)).then((socket) => {
    socket.on(sid, (e) => {
      debug('event form relay', e);
      switch (e.status) {
        case 'walletScanned':
          return dispatch({ type: 'WALLET_SCAN', didwallet: e.didwallet });
        case 'walletConnected':
          return dispatch({ type: 'WALLET_CONNECTED', currentConnected: pick(e, ['userDid', 'userPk', 'wallet']) });
        case 'walletApproved':
          return dispatch({ type: 'WALLET_APPROVE', ...pick(e, ['responseClaims', 'currentStep']) });
        case 'completed':
          return dispatch({ type: 'COMPLETE' });
        case 'error':
          // Do not transit to error state when we receiver propagated error from relay
          return e.source === 'app' ? null : dispatch({ type: 'ERROR', error: e.error });
        case 'rejected':
          return dispatch({ type: 'WALLET_REJECT', error: e.error });
        case 'timeout':
          return dispatch({ type: 'TIMEOUT', error: e.error });
        default:
          return null;
      }
    });
  });

  const machine = createMachine(
    {
      id: `connect.session.${sid}`,
      initial,
      context: {
        sessionId: sid,
        strategy, // strategy used to wallet to select account, can be default or did
        updaterPk: pk, // pk used to verify updater request to avoid accidental overwriting
        error: '',
        previousConnected: null, // previous connected user
        currentConnected: null, // current connected user
        currentStep: 0,
        requestedClaims, // app requested claims, authPrincipal should not be listed here
        responseClaims: [], // wallet submitted claims
        approveResults: [],
      },
      states: {
        // we can do some pre-check here, error thrown from here will halt the process
        start: {
          invoke: {
            id: 'startSession',
            src: _onStart,
            onDone: {
              target: 'loading',
            },
            onError: {
              target: 'error',
              actions: ['onError'],
            },
          },
          on: {
            ERROR: { target: 'error' },
          },
          after: {
            START_TIMEOUT: { target: 'timeout' },
          },
        },

        // generate a session in relay-server by sending a request
        // and get back deep-link to display as qrcode
        loading: {
          invoke: {
            id: 'createSession',
            src: _createOrRestoreSession,
            onDone: {
              target: 'created',
              actions: ['saveAppInfo'],
            },
            onError: {
              target: 'error',
              actions: ['onError'],
            },
          },
          on: {
            ERROR: { target: 'error' },
          },
          after: {
            CREATE_TIMEOUT: { target: 'timeout' },
          },
        },

        // new session generated, wait for wallet to pick up the session
        created: {
          on: {
            WALLET_SCAN: { target: 'walletScanned' },
            APP_CANCELED: { target: 'canceled' },
            ERROR: { target: 'error' },
            CANCEL: { target: 'canceled' },
          },
          after: {
            WALLET_SCAN_TIMEOUT: { target: 'timeout' },
          },
        },

        // wallet has scanned the qrcode
        walletScanned: {
          on: {
            WALLET_CONNECTED: { target: 'walletConnected' },
            WALLET_REJECT: { target: 'rejected' },
            APP_CANCELED: { target: 'canceled' },
            ERROR: { target: 'error' },
            CANCEL: { target: 'canceled' },
          },
          after: {
            WALLET_CONNECT_TIMEOUT: { target: 'timeout' },
          },
        },

        // wallet confirmed the ownership of did for the session
        walletConnected: {
          invoke: {
            id: 'onConnect',
            src: _onConnect,
            onDone: {
              target: 'appConnected',
              actions: ['saveRequestedClaims'],
            },
            onError: {
              target: 'error',
              actions: ['onError'],
            },
          },
          on: {
            APP_CANCELED: { target: 'canceled' },
            ERROR: { target: 'error' },
            CANCEL: { target: 'canceled' },
          },
          entry: ['saveConnectedUser'],
          after: {
            APP_CONNECT_TIMEOUT: { target: 'timeout' },
          },
        },

        // wallet acknowledges that it holds required did
        // and the webapp has settled requested claims
        appConnected: {
          on: {
            APP_CANCELED: { target: 'canceled' },
            WALLET_APPROVE: { target: 'walletApproved' },
            WALLET_REJECT: { target: 'rejected' },
            ERROR: { target: 'error' },
            CANCEL: { target: 'canceled' },
          },
          after: {
            WALLET_APPROVE_TIMEOUT: { target: 'timeout' },
          },
        },

        // wallet has approved the request, can be triggered multiple times
        walletApproved: {
          invoke: {
            id: 'onApprove',
            src: _onApprove,
            onDone: {
              target: 'appApproved',
              actions: ['saveApproveResult'],
            },
            onError: {
              target: 'error',
              actions: ['onError'],
            },
          },
          on: {
            ERROR: { target: 'error' },
            CANCEL: { target: 'canceled' },
          },
          entry: ['saveResponseClaims'],
          exit: ['incrementCurrentStep'],
          after: {
            APP_APPROVE_TIMEOUT: { target: 'timeout' },
          },
        },

        // app has respond on wallet submitted claims
        appApproved: {
          on: {
            WALLET_APPROVE: { target: 'walletApproved' },
            COMPLETE: { target: 'completed' },
            ERROR: { target: 'error' },
            CANCEL: { target: 'canceled' },
          },
        },

        // the who process has completed
        completed: {
          type: 'final',
          entry: ['onComplete'],
        },
        rejected: {
          type: 'final',
          entry: ['saveError', 'onReject'],
        },
        timeout: {
          type: 'final',
          entry: ['saveError', 'onTimeout'],
        },
        canceled: {
          type: 'final',
          entry: ['reportCancel', 'onCancel'],
        },
        error: {
          type: 'final',
          entry: ['saveError', 'onError'],
        },
      },
    },
    {
      actions: {
        onComplete: _onComplete,
        onReject: _onReject,
        onCancel: _onCancel,
        onTimeout: _onTimeout,
        onError: _onError,
        saveAppInfo: assign({ appInfo: (ctx, e) => e.data }), // from client
        saveConnectedUser: assign({ currentConnected: (ctx, e) => e.currentConnected }), // from server
        saveRequestedClaims: assign({ requestedClaims: (ctx, e) => e.data }), // from client
        saveError: assign({ error: (ctx, e) => e.error }), // from server
        incrementCurrentStep: assign({ currentStep: (ctx) => ctx.currentStep + 1 }), // from server
        saveResponseClaims: assign({ responseClaims: (ctx, e) => [...ctx.responseClaims, e.responseClaims] }), // from server
        saveApproveResult: assign({ approveResults: (ctx, e) => [...ctx.approveResults, e.data] }), // from client
        reportCancel: () =>
          doSignedRequest({
            url: sessionApiUrl,
            data: { status: 'canceled' },
            wallet: updater,
            method: 'PUT',
          }),
      },
      delays: { ...DEFAULT_TIMEOUT, ...timeout },
      guards: {},
    }
  );

  return { sessionId: sid, machine, deepLink: createDeepLink(baseUrl, sid) };
};

module.exports = {
  createMachine: createStateMachine,
  createDeepLink,
  destroyConnections,
};
