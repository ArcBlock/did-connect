const { createMachine, assign } = require('xstate');

const noop = () => null;

module.exports = function createConnectMachine({
  sessionId,
  initial = 'start',
  updaterPk,
  strategy = 'default',
  onStart = noop,
  onCreate = noop,
  onConnect,
  onApprove,
  onComplete = noop,
  onReject = noop,
  onCancel = noop,
}) {
  function onError() {
    assign({
      error: (ctx, e) => {
        return e.error;
      },
    });
  }

  return createMachine(
    {
      id: 'DIDConnectSession',
      initial,
      context: {
        sessionId, // uuid.v4()
        strategy, // strategy used to wallet to select account, can be default or did
        updaterPk, // pk used to verify updater request to avoid accidental overwriting
        error: '',
        previousConnected: {
          userDid: '', // previous connected user did
          userPk: '',
          wallet: '',
        },
        currentConnected: {
          userDid: '', // current connected user did
          userPk: '',
        },
        currentStep: 0,
        requestClaims: [], // app requested claims, authPrincipal should not be listed here
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
            src: onCreate,
            onDone: {
              target: 'created',
              actions: ['mergeRemoteSession'],
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
              actions: ['saveRequestClaims'],
            },
            onError: {
              target: 'error',
              actions: ['onError'],
            },
          },
          on: {
            '': [{ target: 'appConnected', cond: 'hasRequestClaims' }],
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
            '': [
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
        onError,
        mergeRemoteSession: assign({
          previousConnected: (ctx, e) => {
            console.log('mergeRemoteSession', e);
            return e.data.previousConnected;
          },
        }),
        saveConnectedUser: assign({
          currentConnected: (ctx, e) => {
            console.log('saveConnectedUser', e);
            return e.data;
          },
        }),
        saveRequestClaims: assign({
          claims: (ctx, e) => {
            console.log('saveRequestClaims', e);
            const claims = Array.isArray(e.data) ? e.data : [e.data];
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
          claims: (ctx, e) => {
            console.log('saveResponseClaims', e);
            return { ...ctx.claims, response: [...ctx.claims.response, e.data] };
          },
        }),
        saveApproveResult: assign({
          results: (ctx, e) => {
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
      delays: {
        START_TIMEOUT: 10 * 1000, // webapp-callback
        CREATE_TIMEOUT: 10 * 1000, // relay-server
        WALLET_SCAN_TIMEOUT: 60 * 1000, // user-wallet
        WALLET_CONNECT_TIMEOUT: 60 * 1000, // user-wallet
        WALLET_APPROVE_TIMEOUT: 60 * 1000, // user-wallet
        APP_CONNECT_TIMEOUT: 20 * 1000, // webapp-callback
        APP_APPROVE_TIMEOUT: 20 * 1000, // webapp-callback
      },
    }
  );
};
