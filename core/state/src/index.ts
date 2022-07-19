/* eslint-disable @typescript-eslint/naming-convention */
import type { Promisable } from 'type-fest';
import type { TAppResponse, TSession, TAnyRequest, TAnyObject, TSessionStatus, TEvent } from '@did-connect/types';

import get from 'lodash/get';
import isFunction from 'lodash/isFunction';
import isArray from 'lodash/isArray';
import { nanoid } from 'nanoid';
import { createMachine, assign, StateMachine } from 'xstate';
import { SessionTimeout, CustomError, isUrl, isRequestList } from '@did-connect/types';

import { createApiUrl, createDeepLink, createSocketEndpoint, doSignedRequest, getUpdater } from './util';
import { createConnection, destroyConnections } from './socket';

const noop = () => undefined;

export type TSessionContext = TSession;
export type TSessionEvent = TEvent;
export type TSessionState = {
  value: TSessionStatus;
  context: TSession;
};

export type TEventCallback = (context: TSessionContext, event: TSessionEvent) => Promisable<void>;
export type TConnectCallback = (context: TSessionContext, event: TSessionEvent) => Promisable<TAnyRequest[][]>;
export type TApproveCallback = (context: TSessionContext, event: TSessionEvent) => Promisable<TAppResponse>;

export type TSessionOptions = {
  // onConnect can be one of the following:
  // - a function that returns the requestedClaims list
  // - an requestedClaims list
  // - a URL that can be used to retrieve the requestedClaims list
  onConnect: TConnectCallback | TAnyRequest[][] | string;

  // onApprove can be one of the following:
  // - a function that returns the approveResult
  // - a URL that can be used to retrieve the approveResult
  onApprove: TApproveCallback | string;

  relayUrl?: string;
  initial?: TSessionStatus;
  sessionId?: string;
  strategy?: string;
  dispatch: (...args: any[]) => void;
  onStart?: TEventCallback;
  onCreate?: TEventCallback;
  onComplete?: TEventCallback;
  onReject?: TEventCallback;
  onCancel?: TEventCallback;
  onTimeout?: TEventCallback;
  onError?: TEventCallback;
  autoConnect?: boolean;
  onlyConnect?: boolean;
  timeout?: typeof SessionTimeout;
};

export type TSessionMachine = {
  sessionId: string;
  machine: StateMachine<TSessionContext, TSessionState, TSessionEvent, TSessionState>;
  deepLink: string;
  cleanup: () => Promisable<any>;
};

export function createStateMachine(options: TSessionOptions): TSessionMachine {
  const {
    relayUrl = '/api/connect/relay',
    initial = 'start', // we maybe reusing existing session
    sessionId = '', // we maybe reusing existing session
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
    onlyConnect = false,
    timeout = SessionTimeout,
  } = options;

  if (sessionId && sessionId.length !== 21) {
    throw new CustomError('INVALID_SESSION_ID', 'Invalid sessionId, which must be a valid 21 char nanoid');
  }

  // verify callbacks
  const fns: TAnyObject = {
    dispatch,
    onStart,
    onCreate,
    onComplete,
    onReject,
    onCancel,
    onTimeout,
    onError,
  };
  Object.keys(fns).forEach((x) => {
    if (isFunction(fns[x]) === false) {
      throw new CustomError('INVALID_CALLBACK', `Invalid ${x}, which must be a function`);
    }
  });

  // verify onConnect
  let connectUrl = '';
  let requestedClaims: TAnyRequest[][] = [];
  if (isFunction(onConnect) === false) {
    if (typeof onConnect === 'string') {
      if (isUrl(onConnect) === false) {
        throw new CustomError('INVALID_CALLBACK', 'Invalid onConnect, which must be a valid URL');
      }
      connectUrl = onConnect;
    } else if (isArray(onConnect)) {
      if (isRequestList(onConnect).code !== 'OK') {
        throw new CustomError('INVALID_CALLBACK', 'Invalid onConnect, which must be a request list');
      }
      requestedClaims = onConnect;
    } else {
      throw new CustomError('INVALID_CALLBACK', 'Invalid onConnect, which must be a function or an array or a URL');
    }
  }

  // verify onApprove
  let approveUrl = '';
  if (isFunction(onApprove) === false) {
    if (typeof onApprove === 'string') {
      if (isUrl(onApprove) === false) {
        throw new CustomError('INVALID_CALLBACK', 'Invalid onApprove, which must be a valid URL');
      }
      approveUrl = onApprove;
    } else {
      throw new CustomError('INVALID_CALLBACK', 'Invalid onApprove, which must be a function or an object or a URL');
    }
  }

  const updater = getUpdater();
  const sid = sessionId || nanoid();
  const pk = updater.publicKey.toString();

  const authApiUrl = createApiUrl(relayUrl, sid, '/auth');
  const sessionApiUrl = createApiUrl(relayUrl, sid, '/session');

  const _onStart = async (ctx: TSessionContext, e: TSessionEvent) => {
    await onStart(ctx, e);
  };

  const createOrRestoreSession = async (ctx: TSessionContext, e: TSessionEvent) => {
    const isExistingSession = sid === sessionId;
    let session = null;
    if (isExistingSession) {
      try {
        session = await doSignedRequest({
          url: sessionApiUrl,
          data: {},
          wallet: updater,
          method: 'GET',
        });
        if (session.status !== 'created') {
          throw new CustomError(
            'INVALID_SESSION',
            `Invalid existing session status, expecting created, got ${session.status}`
          );
        }
      } catch (err: any) {
        if (err.name === 'AxiosError') {
          throw new CustomError(get(err, 'response.data.code'), get(err, 'response.data.error'));
        }

        throw err;
      }
    } else {
      // Create new session
      session = await doSignedRequest({
        url: sessionApiUrl,
        data: {
          sessionId: sid,
          updaterPk: pk,
          strategy,
          authUrl: authApiUrl,
          connectUrl,
          approveUrl,
          autoConnect,
          onlyConnect,
          requestedClaims,
          timeout,
        },
        wallet: updater,
        method: 'POST',
      });
    }

    await onCreate(ctx, e);
    return session.appInfo;
  };

  const _onConnect = async (ctx: TSessionContext, e: TSessionEvent): Promise<TAnyRequest[][]> => {
    if (ctx.requestedClaims.length) {
      return ctx.requestedClaims;
    }

    if (isFunction(onConnect)) {
      const claims = await onConnect(ctx, e);
      const result = await doSignedRequest({
        url: sessionApiUrl,
        data: { requestedClaims: claims || [] },
        wallet: updater,
        method: 'PUT',
      });
      return result.requestedClaims;
    }

    return [];
  };

  const _onApprove = async (ctx: TSessionContext, e: TSessionEvent): Promise<TAppResponse> => {
    let approveResult = {};
    if (isFunction(onApprove)) {
      approveResult = await onApprove(ctx, e);
      if (typeof approveResult === 'undefined') {
        approveResult = {};
      }
    }

    if (approveResult) {
      await doSignedRequest({
        url: sessionApiUrl,
        data: { approveResults: [...ctx.approveResults, approveResult] },
        wallet: updater,
        method: 'PUT',
      });
    }

    return approveResult;
  };

  const _onComplete = async (ctx: TSessionContext, e: TSessionEvent) => {
    await onComplete(ctx, e);
  };

  const _onReject = async (ctx: TSessionContext, e: TSessionEvent) => {
    await onReject(ctx, e);
  };

  // FIXME: report timeout events to server
  const _onTimeout = async (ctx: TSessionContext, e: TSessionEvent) => {
    await onTimeout(ctx, e);
  };

  const _onCancel = async (ctx: TSessionContext, e: TSessionEvent) => {
    await onCancel(ctx, e);
  };

  // report some client error to relay, and execute callback
  const _onError = async (ctx: TSessionContext, e: TSessionEvent) => {
    if (e.data) {
      console.error('Client', e.data);
      if (['SESSION_NOT_FOUND', 'SESSION_FINALIZED'].includes(e.data.code) === false) {
        doSignedRequest({
          url: sessionApiUrl,
          data: { status: 'error', error: e.data.message },
          wallet: updater,
          method: 'PUT',
        }).catch((err) => console.error('Report Error', get(err, 'response.data.error', err.message)));
      }
    }
    await onError(ctx, e);
  };

  // TODO: fallback to polling when socket connection failed
  createConnection(createSocketEndpoint(relayUrl)).then((socket) => {
    socket.on(sid, (e: TSessionEvent) => {
      switch (e.status) {
        case 'walletScanned':
          return dispatch({ ...e, type: 'WALLET_SCAN' });
        case 'walletConnected':
          return dispatch({ ...e, type: 'WALLET_CONNECTED' });
        case 'appConnected':
          return e.requestedClaims?.length ? dispatch({ ...e, type: 'APP_CONNECTED' }) : null;
        case 'walletApproved':
          return dispatch({ ...e, type: 'WALLET_APPROVE' });
        case 'appApproved':
          return e.approveResults?.length ? dispatch({ ...e, type: 'APP_APPROVED' }) : null;
        case 'completed':
          return dispatch({ ...e, type: 'COMPLETE' });
        case 'error':
          // Do not transit to error state when we receiver propagated error from relay
          return e.source === 'app' ? null : dispatch({ ...e, type: 'ERROR' });
        case 'rejected':
          return dispatch({ ...e, type: 'WALLET_REJECT' });
        case 'timeout':
          // let's turn server side timeout to errors
          return dispatch({ ...e, type: 'ERROR' });
        default:
          return null;
      }
    });
  });

  const connectService = {
    id: 'onConnect',
    src: _onConnect,
    onDone: {
      target: 'appConnected',
      actions: [],
    },
    onError: {
      target: 'error',
      actions: ['onError'],
    },
  };

  const approveService = {
    id: 'onApprove',
    src: _onApprove,
    onDone: {
      target: 'appApproved',
      actions: [],
    },
    onError: {
      target: 'error',
      actions: ['onError'],
    },
  };

  const machine = createMachine<TSessionContext, TSessionEvent, TSessionState>(
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
        autoConnect,
        onlyConnect,
        authUrl: authApiUrl,
        timeout,
        challenge: '',
        // @ts-ignore
        appInfo: null,
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
            app: { target: 'timeout' },
          },
        },

        // generate a session in relay-server by sending a request
        // and get back deep-link to display as qrcode
        loading: {
          invoke: {
            id: 'createSession',
            src: createOrRestoreSession,
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
            relay: { target: 'timeout' },
          },
        },

        // new session generated, wait for wallet to pick up the session
        created: {
          on: {
            WALLET_SCAN: { target: 'walletScanned' },
            APP_CANCELED: { target: 'canceled' },
            ERROR: { target: 'error' },
            CANCEL: { target: 'canceled' },
            TIMEOUT: { target: 'timeout' },
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
            TIMEOUT: { target: 'timeout' },
          },
          after: {
            wallet: { target: 'timeout' },
          },
        },

        // wallet confirmed the ownership of did for the session
        walletConnected: {
          invoke: connectUrl ? undefined : connectService,
          on: {
            WALLET_APPROVE: { target: 'walletApproved' },
            APP_CONNECTED: { target: 'appConnected' },
            APP_CANCELED: { target: 'canceled' },
            ERROR: { target: 'error' },
            CANCEL: { target: 'canceled' },
            TIMEOUT: { target: 'timeout' },
          },
          entry: ['saveConnectedUser'],
          after: {
            app: { target: 'timeout' },
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
            TIMEOUT: { target: 'timeout' },
          },
          entry: ['saveRequestedClaims'],
          after: {
            wallet: { target: 'timeout' },
          },
        },

        // wallet has approved the request, can be triggered multiple times
        walletApproved: {
          invoke: approveUrl ? undefined : approveService,
          on: {
            APP_APPROVED: { target: 'appApproved' },
            ERROR: { target: 'error' },
            CANCEL: { target: 'canceled' },
            TIMEOUT: { target: 'timeout' },
          },
          entry: ['saveResponseClaims'],
          exit: ['incrementCurrentStep'],
          after: {
            app: { target: 'timeout' },
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
          entry: ['saveApproveResults'],
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
        saveAppInfo: assign<TSessionContext, TSessionEvent>({
          appInfo: (ctx: TSessionContext, e: TSessionEvent) => e.data,
        }), // from client
        saveConnectedUser: assign<TSessionContext, TSessionEvent>({
          currentConnected: (ctx: TSessionContext, e: TSessionEvent) => e.currentConnected,
        }), // from server
        saveRequestedClaims: assign<TSessionContext, TSessionEvent>({
          requestedClaims: (ctx: TSessionContext, e: TSessionEvent) =>
            e.requestedClaims || e.data || ctx.requestedClaims,
        }), // from client|server
        saveError: assign<TSessionContext, TSessionEvent>({
          error: (ctx: TSessionContext, e: TSessionEvent) => get(e, 'data.message') || e.error,
        }), // from client or server
        incrementCurrentStep: assign<TSessionContext, TSessionEvent>({
          currentStep: (ctx: TSessionContext) => ctx.currentStep + 1,
        }), // from server
        saveResponseClaims: assign<TSessionContext, TSessionEvent>({
          responseClaims: (ctx: TSessionContext, e: TSessionEvent) => [...ctx.responseClaims, e.responseClaims],
          currentStep: (ctx: TSessionContext, e: TSessionEvent) => e.currentStep,
          challenge: (ctx: TSessionContext, e: TSessionEvent) => e.challenge,
        }), // from server
        saveApproveResults: assign<TSessionContext, TSessionEvent>({
          approveResults: (ctx: TSessionContext, e: TSessionEvent) =>
            e.approveResults || [...ctx.approveResults, e.data],
        }), // from client|server
        reportCancel: () =>
          doSignedRequest({
            url: sessionApiUrl,
            data: { status: 'canceled' },
            wallet: updater,
            method: 'PUT',
          }),
      },
      delays: { ...SessionTimeout, ...timeout },
      guards: {},
    }
  );

  const cleanup = () =>
    doSignedRequest({
      url: sessionApiUrl,
      data: {},
      wallet: updater,
      method: 'DELETE',
    });

  return { sessionId: sid, machine, deepLink: createDeepLink(relayUrl, sid), cleanup };
}

export { createDeepLink, destroyConnections };
