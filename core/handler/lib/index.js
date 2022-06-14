const pick = require('lodash/pick');
const isEmpty = require('lodash/isEmpty');
const waitFor = require('p-wait-for');
const Jwt = require('@arcblock/jwt');
const objectHash = require('object-hash');
const { WsServer } = require('@arcblock/ws');
const { isValid } = require('@arcblock/did');
const { context: contextSchema, session: sessionSchema } = require('@did-connect/validator');

// eslint-disable-next-line
// const debug = require('debug')(`${require('../package.json').name}`);

const { getStepChallenge, parseWalletUA } = require('./util');

const errors = {
  sessionNotFound: {
    en: 'Session not found or expired',
    zh: '会话不存在或已过期',
  },
  didMismatch: {
    en: 'Login user and wallet user mismatch, please reconnect and try again',
    zh: '登录用户和扫码用户不匹配，为保障安全，请重新登录应用',
  },
  challengeMismatch: {
    en: 'Challenge mismatch',
    zh: '随机校验码不匹配',
  },
  userDeclined: {
    en: 'You have declined the authentication request',
    zh: '授权请求被拒绝',
  },
  userCanceled: {
    en: 'User has canceled the request from app',
    zh: '用户在应用端取消了请求',
  },
};

class CustomError extends Error {
  constructor(code, message) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
    this.code = code;
  }
}

function createSocketServer(logger, pathname) {
  return new WsServer({ logger, pathname });
}

// FIXME: i18n for errors
function createHandlers({
  storage,
  authenticator,
  logger = console,
  timeout = 20 * 1000, // how long to wait when wait for app events
  socketPathname = '/api/connect/relay/websocket',
}) {
  const wsServer = createSocketServer(logger, socketPathname);

  const isValidContext = (x) => {
    const { error } = contextSchema.validate(x);
    // if (error) logger.error(error);
    return !error;
  };

  const signJson = authenticator.signJson.bind(authenticator);
  const signClaims = authenticator.signClaims.bind(authenticator);

  const verifyUpdater = (params, updaterPk) => {
    const { body, signerPk, signerToken } = params;
    if (!signerPk) {
      return { error: 'Invalid updater pk', code: 'UPDATER_PK_EMPTY' };
    }
    if (!signerToken) {
      return { error: 'Invalid token', code: 'SIGNATURE_EMPTY' };
    }

    if (Jwt.verify(signerToken, signerPk) === false) {
      return { error: 'Invalid updater signature', code: 'SIGNATURE_INVALID' };
    }

    if (updaterPk && updaterPk !== signerPk) {
      return { error: 'Invalid updater', code: 'UPDATER_MISMATCH' };
    }

    const hash = objectHash(body);
    const decoded = Jwt.decode(signerToken);
    if (decoded.hash !== hash) {
      return { error: 'Invalid payload hash', code: 'PAYLOAD_HASH_MISMATCH' };
    }

    return { error: null };
  };

  const handleSessionCreate = async (context) => {
    if (isValidContext(context) === false) {
      return { error: 'Invalid context', code: 'CONTEXT_INVALID' };
    }

    const {
      sessionId,
      updaterPk,
      strategy = 'default',
      authUrl,
      autoConnect,
      onlyConnect,
      requestedClaims = [],
    } = context.body;

    if (sessionId.length !== 21) {
      return { error: 'Invalid sessionId', code: 'SESSION_ID_INVALID' };
    }

    const result = verifyUpdater(context);
    if (result.error) {
      return result;
    }

    const session = {
      status: 'created',
      updaterPk,
      strategy,
      authUrl,
      challenge: getStepChallenge(),
      autoConnect,
      onlyConnect,
      // FIXME: app link should be updated according to blocklet env?
      appInfo: await authenticator.getAppInfo({ ...context, baseUrl: new URL(authUrl).origin }),
      previousConnected: context.previousConnected,
      currentConnected: null,
      currentStep: 0,
      requestedClaims, // app requested claims, authPrincipal should not be listed here
      responseClaims: [], // wallet submitted claims
      approveResults: [],
      error: '',
    };

    const { value, error } = sessionSchema.validate(session);
    if (error) {
      return {
        error: `Invalid session updates: ${error.details.map((x) => x.message).join(', ')}`,
        code: 'SESSION_UPDATE_INVALID',
      };
    }

    return storage.create(sessionId, value);
  };

  const handleSessionRead = async (sessionId) => {
    return storage.read(sessionId);
  };

  const handleSessionUpdate = (context) => {
    if (isValidContext(context) === false) {
      return { error: 'Invalid context', code: 'CONTEXT_INVALID' };
    }

    const { body, session } = context;
    if (storage.isFinalized(session.status)) {
      return {
        error: `Session finalized as ${session.status}${session.error ? `: ${session.error}` : ''}`,
        code: 'SESSION_FINALIZED',
      };
    }

    const result = verifyUpdater(context, session.updaterPk);
    if (result.error) {
      return result;
    }

    if (body.status && ['error', 'canceled'].includes(body.status) === false) {
      return { error: 'Invalid session status', code: 'SESSION_STATUS_INVALID' };
    }

    const { error, value } = sessionSchema.validate({ ...session, ...body });
    if (error) {
      return {
        error: `Invalid session updates: ${error.details.map((x) => x.message).join(', ')}`,
        code: 'SESSION_UPDATE_INVALID',
      };
    }

    const updates = pick(value, ['error', 'status', 'approveResults', 'requestedClaims']);
    logger.info('update session', context.sessionId, updates);
    return storage.update(context.sessionId, updates);
  };

  const handleClaimRequest = async (context) => {
    const { sessionId, session, didwallet } = context;

    try {
      if (isValidContext(context) === false) {
        throw new CustomError('CONTEXT_INVALID', 'Invalid context');
      }

      const { strategy, previousConnected, onlyConnect, currentStep } = session;
      if (storage.isFinalized(session.status)) {
        throw new CustomError(
          'SESSION_FINALIZED',
          `Session finalized as ${session.status}${session.error ? `: ${session.error}` : ''}`
        );
      }

      // if we are in created status, we should return authPrincipal claim
      if (session.status === 'created') {
        wsServer.broadcast(sessionId, { status: 'walletScanned', didwallet });
        await storage.update(sessionId, { status: 'walletScanned' });

        return signClaims(
          [
            {
              type: 'authPrincipal',
              description: 'select the principal to be used for authentication',
              target: isValid(strategy) ? strategy : '',
              supervised: onlyConnect || !!previousConnected,
            },
          ],
          context
        );
      }

      // else we should perform a step by step style
      return signClaims(session.requestedClaims[currentStep], context);
    } catch (err) {
      logger.error(err);
      wsServer.broadcast(sessionId, { status: 'error', error: err.message });
      await storage.update(sessionId, { status: 'error', error: err.message });
      return signJson({ error: err.message }, context);
    }
  };

  const waitForSession = async (sessionId, checkFn, reason, locale) => {
    let session = null;
    try {
      await waitFor(
        async () => {
          session = await storage.read(sessionId);
          if (session.status === 'error') {
            throw new CustomError('AppError', session.error);
          }
          if (session.status === 'canceled') {
            throw new CustomError('AppCanceled', errors.userCanceled[locale]);
          }

          return checkFn(session);
        },
        { interval: 200, timeout, before: false }
      );
      return storage.read(sessionId);
    } catch (err) {
      if (session && ['error', 'canceled'].includes(session.status) === false) {
        throw new CustomError('TimeoutError', `${reason} within ${timeout}ms`);
      }

      throw err;
    }
  };

  const waitForAppConnect = (sessionId, locale) =>
    waitForSession(sessionId, (x) => x.requestedClaims.length > 0, 'Requested claims not provided by app', locale);

  const waitForAppApprove = (sessionId, locale) =>
    waitForSession(
      sessionId,
      (x) => typeof x.approveResults[x.currentStep] !== 'undefined',
      'Response claims not handled by app',
      locale
    );

  const handleClaimResponse = async (context) => {
    const { sessionId, session, body, locale, didwallet } = context;
    try {
      if (isValidContext(context) === false) {
        throw new CustomError('CONTEXT_INVALID', 'Invalid context');
      }

      if (storage.isFinalized(session.status)) {
        throw new CustomError(
          'SESSION_FINALIZED',
          `Session finalized as ${session.status}${session.error ? `: ${session.error}` : ''}`
        );
      }

      const { userDid, userPk, action, challenge, claims } = await authenticator.verify(body, locale);
      let newSession;

      // Ensure user approval
      if (action === 'declineAuth') {
        throw new CustomError('RejectError', errors.userDeclined[locale]);
      }

      // Ensure challenge match
      if (challenge !== session.challenge) {
        throw new Error(errors.challengeMismatch[locale]);
      }

      const handleWalletApprove = async () => {
        await storage.update(sessionId, {
          status: 'walletApproved',
          responseClaims: [...session.responseClaims, claims],
        });
        wsServer.broadcast(sessionId, {
          status: 'walletApproved',
          responseClaims: isEmpty(claims) ? [session.currentConnected] : claims,
          currentStep: session.currentStep,
          challenge: session.challenge,
        });
        newSession = await waitForAppApprove(sessionId, locale);
        await storage.update(sessionId, { status: 'appApproved' });
        wsServer.broadcast(sessionId, {
          status: 'appApproved',
          approveResult: newSession.approveResults[session.currentStep],
        });
      };

      // If wallet is submitting authPrincipal claim,
      // move to walletConnected and wait for appConnected
      // once appConnected we return the first claim
      if (session.status === 'walletScanned') {
        await storage.update(sessionId, { status: 'walletConnected', currentConnected: { userDid, userPk } });
        wsServer.broadcast(sessionId, { status: 'walletConnected', userDid, userPk, wallet: didwallet });

        // If this is a connect-only session, end it: walletApprove --> appApprove --> complete
        if (session.onlyConnect) {
          await handleWalletApprove();
          await storage.update(sessionId, { status: 'completed' });
          wsServer.broadcast(sessionId, { status: 'completed' });
          return signJson(newSession.approveResults[session.currentStep], context);
        }

        // If our claims are populated already, move to appConnected without waiting
        if (session.requestedClaims.length > 0) {
          newSession = await storage.update(sessionId, { status: 'appConnected' });
          wsServer.broadcast(sessionId, { status: 'appConnected', requestedClaims: newSession.requestedClaims });
        } else {
          newSession = await waitForAppConnect(sessionId, locale);
          await storage.update(sessionId, { status: 'appConnected' });
          wsServer.broadcast(sessionId, { status: 'appConnected', requestedClaims: newSession.requestedClaims });
        }
        return signClaims(newSession.requestedClaims[session.currentStep], { ...context, session: newSession });
      }

      // Move to walletApproved state and wait for appApproved
      await handleWalletApprove();

      // Return result if we've done
      const isDone = session.currentStep === session.requestedClaims.length - 1;
      if (isDone) {
        await storage.update(sessionId, { status: 'completed' });
        wsServer.broadcast(sessionId, { status: 'completed' });
        return signJson(newSession.approveResults[session.currentStep], context);
      }

      // Move on to next step if we are not the last step
      const nextStep = session.currentStep + 1;
      const nextChallenge = getStepChallenge();
      newSession = await storage.update(sessionId, { currentStep: nextStep, challenge: nextChallenge });
      return signClaims(session.requestedClaims[nextStep], { ...context, session: newSession });
    } catch (err) {
      logger.error(err);

      // error reported by dapp
      if (err.code === 'AppError') {
        wsServer.broadcast(sessionId, { status: 'error', error: err.message, source: 'app' });
        return signJson({ error: err.message }, context);
      }

      // error reported by dapp
      if (err.code === 'AppCanceled') {
        wsServer.broadcast(sessionId, { status: 'canceled', error: err.message, source: 'app' });
        return signJson({ error: err.message }, context);
      }

      // timeout error
      if (err.code === 'TimeoutError') {
        await storage.update(sessionId, { status: 'timeout', error: err.message });
        wsServer.broadcast(sessionId, { status: 'timeout', error: err.message, source: 'timer' });
        return signJson({ error: err.message }, context);
      }

      // reject error
      if (err.code === 'RejectError') {
        await storage.update(sessionId, { status: 'rejected', error: err.message });
        wsServer.broadcast(sessionId, { status: 'rejected', error: err.message, source: 'wallet' });
        return signJson({}, context);
      }

      // anything else
      await storage.update(sessionId, { status: 'error', error: err.message });
      wsServer.broadcast(sessionId, { status: 'error', error: err.message, code: err.code });
      return signJson({ error: err.message }, context);
    }
  };

  return {
    handleSessionCreate,
    handleSessionRead,
    handleSessionUpdate,
    handleClaimRequest,
    handleClaimResponse,
    parseWalletUA,
    wsServer,
  };
}

module.exports = createHandlers;
