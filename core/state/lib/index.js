const uuid = require('uuid');
const wrap = require('lodash/wrap');
const pick = require('lodash/pick');
const { createMachine, assign } = require('xstate');

const { createAuthUrl, createDeepLink, createSocketEndpoint, doSignedRequest, getUpdater } = require('./util');
const { createConnection, destroyConnections } = require('./socket');

const noopAsync = async () => undefined; // FIXME: how to detect if the function returns a promise
const returnAsync = async (x) => x;
const DEFAULT_TIMEOUT = {
  START_TIMEOUT: 10 * 1000, // webapp-callback
  CREATE_TIMEOUT: 10 * 1000, // relay-server
  WALLET_SCAN_TIMEOUT: 60 * 1000, // user-wallet
  WALLET_CONNECT_TIMEOUT: 60 * 1000, // user-wallet
  WALLET_APPROVE_TIMEOUT: 60 * 1000, // user-wallet
  APP_CONNECT_TIMEOUT: 20 * 1000, // webapp-callback
  APP_APPROVE_TIMEOUT: 20 * 1000, // webapp-callback
};

const createStateMachine = ({
  baseUrl = '/api/connect/relay',
  initial = 'start', // we maybe reusing existing session
  sessionId, // we maybe reusing existing session
  strategy = 'default',
  dispatch, // handle events emitted from websocket relay
  onStart = noopAsync,
  onCreate = returnAsync,
  onConnect, // TODO: can be claim object, claim list, function that returns either object or list
  onApprove, // TODO: must be a function
  onComplete = noopAsync,
  onReject = noopAsync,
  onCancel = noopAsync,
  timeout = DEFAULT_TIMEOUT,
}) => {
  if (sessionId && uuid.validate(sessionId) === false) {
    throw new Error('Invalid session id, which must be a valid uuid.v4');
  }

  // FIXME: how do we ensure updaterPk is a valid public key?

  const updater = getUpdater();
  const sid = sessionId || uuid.v4();
  const pk = updater.publicKey;

  const _onCreate = wrap(onCreate, async (cb) => {
    try {
      const authUrl = createAuthUrl(baseUrl, sid);
      console.log('_onCreate.authUrl', authUrl);
      const session = await doSignedRequest({
        data: { sessionId: sid, updaterPk: pk, authUrl },
        wallet: updater,
        baseUrl,
      });
      console.log('_onCreate.session', session);
      await cb(session);
    } catch (err) {
      console.error(err);
    }
  });

  const _onError = () =>
    assign({
      error: (ctx, e) => {
        console.log('_onError', e);
        return e.error;
      },
    });

  createConnection(createSocketEndpoint(baseUrl)).then((socket) => {
    socket.on(sid, (e) => {
      console.log('event', e);
      if (e.status === 'walletScanned') {
        dispatch({ type: 'WALLET_SCAN', didwallet: e.didwallet });
      } else if (e.status === 'walletConnected') {
        dispatch({ type: 'WALLET_CONNECTED', connectedUser: pick(e, ['userDid', 'userPk']) });
      } else if (e.status === 'walletApproved') {
        dispatch({ type: 'WALLET_APPROVE', ...pick(e, ['claims', 'currentStep']) });
      } else if (e.status === 'completed') {
        onComplete(e);
      } else if (e.status === 'error') {
        onReject(e);
      } else if (e.status === 'rejected') {
        onCancel(e);
      } else if (e.status === 'timeout') {
        onCancel(e);
      }
    });
  });

  console.log('sessionId', sid);

  const machine = createMachine(
    {
      id: 'DIDConnectSession',
      initial,
      context: {
        sessionId: sid,
        strategy, // strategy used to wallet to select account, can be default or did
        updaterPk: pk, // pk used to verify updater request to avoid accidental overwriting
        error: '',
        previousConnected: null, // previous connected user
        currentConnected: null, // current connected user
        currentStep: 0,
        requestedClaims: [], // app requested claims, authPrincipal should not be listed here
        responseClaims: [], // wallet submitted claims
        approveResults: [],
      },
      states: {
        // we can do some pre-check here, error thrown from here will halt the process
        start: {
          invoke: {
            id: 'startSession',
            src: onStart,
            onDone: {
              target: 'loading',
            },
            onError: {
              target: 'error',
              actions: ['onError'],
            },
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
            src: _onCreate,
            onDone: {
              target: 'created',
            },
            onError: {
              target: 'error',
              actions: ['onError'],
            },
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
          },
          after: {
            WALLET_CONNECT_TIMEOUT: { target: 'timeout' },
          },
        },

        // wallet confirmed the ownership of did for the session
        walletConnected: {
          invoke: {
            id: 'onConnect',
            src: onConnect,
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
            always: [{ target: 'appConnected', cond: 'hasRequestClaims' }],
            APP_CANCELED: { target: 'canceled' },
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
          },
          after: {
            WALLET_APPROVE_TIMEOUT: { target: 'timeout' },
          },
        },

        // wallet has approved the request, can be triggered multiple times
        walletApproved: {
          invoke: {
            id: 'onApprove',
            // should emit event and wait for app callback when run in backend
            // should call user callback on frontend
            src: onApprove,
            onDone: {
              target: 'appApproved',
              actions: ['saveApproveResult'],
            },
            onError: {
              target: 'error',
              actions: ['onError'],
            },
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
            always: [
              { target: 'walletApproved', cond: 'allStepsNotDone' },
              { target: 'completed', cond: 'allStepsDone' },
            ],
          },
        },

        // the who process has completed
        completed: {
          type: 'final',
          entry: ['onComplete'],
        },

        rejected: {
          type: 'final',
          entry: ['onReject'],
        },
        timeout: {
          type: 'final',
        },
        canceled: {
          type: 'final',
          entry: ['onCancel'],
        },
        error: {
          type: 'final',
          entry: ['onError'],
        },
      },
    },
    {
      actions: {
        onConnect,
        onApprove,
        onReject,
        onComplete,
        onCancel,
        onError: _onError,
        saveConnectedUser: assign({
          currentConnected: (ctx, e) => {
            console.log('saveConnectedUser', e);
            return e.connectedUser;
          },
        }),
        saveRequestedClaims: assign({
          requestedClaims: (ctx, e) => {
            console.log('saveRequestedClaims', e);
            const claims = Array.isArray(e.claims) ? e.claims : [e.claims];
            return { ...ctx.claims, request: claims };
          },
        }),
        incrementCurrentStep: assign({
          currentStep: (ctx, e) => {
            console.log('incrementCurrentStep', e);
            return ctx.currentStep + 1;
          },
        }),
        saveResponseClaims: assign({
          responseClaims: (ctx, e) => {
            console.log('saveResponseClaims', e);
            return { ...ctx.claims, response: [...ctx.claims.response, e.data] };
          },
        }),
        saveApproveResult: assign({
          approveResults: (ctx, e) => {
            console.log('saveApproveResult', e);
            return { ...ctx.results, approve: [...ctx.results.approve, e.data] };
          },
        }),
      },
      guards: {
        hasRequestClaims: (ctx, e) => {
          return ctx.claims.request.length > 0;
        },
        allStepsDone: (ctx, e) => {
          return ctx.currentStep === ctx.claims.request.length;
        },
        allStepsNotDone: (ctx, e) => {
          return ctx.currentStep < ctx.claims.request.length;
        },
      },
      delays: { ...DEFAULT_TIMEOUT, ...timeout },
    }
  );

  return machine;
};

module.exports = {
  createMachine: createStateMachine,
  createDeepLink,
  createAuthUrl,
  destroyConnections,
};
