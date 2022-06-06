const uuid = require('uuid');
const pick = require('lodash/pick');
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
};

function CustomError(code, reason) {
  const err = new Error(reason);
  err.code = code;
  return err;
}

function createSocketServer(logger, pathname) {
  return new WsServer({ logger, pathname });
}

// TODO: remove the session after complete/expire/canceled/rejected
// FIXME: i18n for errors
function createHandlers({
  storage,
  authenticator,
  logger = console,
  timeout = 20 * 1000,
  socketPathname = '/api/connect/relay/websocket',
}) {
  const wsServer = createSocketServer(logger, socketPathname);

  const isSessionFinalized = (x) => ['error', 'timeout', 'canceled', 'rejected', 'completed'].includes(x.status);
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
      return { error: 'Invalid updater pk', code: 400 };
    }
    if (!signerToken) {
      return { error: 'Invalid token', code: 400 };
    }

    if (Jwt.verify(signerToken, signerPk) === false) {
      return { error: 'Invalid updater signature', code: 400 };
    }

    if (updaterPk && updaterPk !== signerPk) {
      return { error: 'Invalid updater', code: 403 };
    }

    const hash = objectHash(body);
    const decoded = Jwt.decode(signerToken);
    if (decoded.hash !== hash) {
      return { error: 'Invalid payload hash', code: 400 };
    }

    return { error: null };
  };

  const handleSessionCreate = async (context) => {
    if (isValidContext(context) === false) {
      return { error: 'Invalid context', code: 400 };
    }

    const { sessionId, updaterPk, strategy = 'default', authUrl, requestedClaims = [] } = context.body;

    if (uuid.validate(sessionId) === false) {
      return { error: 'Invalid sessionId', code: 400 };
    }

    const result = verifyUpdater(context);
    if (result.error) {
      return result;
    }

    const session = {
      status: 'created',
      updaterPk,
      strategy,
      // the client shall compose the deep-link by itself, since the rules are simple enough
      authUrl,
      challenge: getStepChallenge(),
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
      return { error: `Invalid session: ${error.details.map((x) => x.message).join(', ')}`, code: 400 };
    }

    return storage.create(sessionId, value);
  };

  const handleSessionRead = async (sessionId) => {
    return storage.read(sessionId);
  };

  const handleSessionUpdate = (context) => {
    if (isValidContext(context) === false) {
      return { error: 'Invalid context', code: 400 };
    }

    if (isSessionFinalized(context.session)) {
      return { error: 'Session finalized', code: 400 };
    }

    const { body, session } = context;
    const result = verifyUpdater(context, session.updaterPk);
    if (result.error) {
      return result;
    }

    if (body.status && ['error', 'canceled'].includes(body.status) === false) {
      return { error: 'Invalid session status', code: 400 };
    }

    logger.info('update session', context.sessionId, body);
    const { error, value } = sessionSchema.validate({ ...session, ...body });
    if (error) {
      return { error: `Invalid session: ${error.details.map((x) => x.message).join(', ')}`, code: 400 };
    }

    const updates = pick(value, ['error', 'status', 'approveResults', 'requestedClaims']);
    return storage.update(context.sessionId, updates);
  };

  const handleClaimRequest = async (context) => {
    if (isValidContext(context) === false) {
      return signJson({ error: 'Invalid context', code: 400 }, context);
    }

    const { sessionId, session, didwallet } = context;
    const { strategy, previousConnected, currentStep } = session;
    try {
      if (isSessionFinalized(session)) {
        return signJson({ error: 'Session finalized', code: 400 }, context);
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
              supervised: !!previousConnected,
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

  const waitForSession = async (sessionId, checkFn, reason) => {
    let session = null;
    try {
      await waitFor(
        async () => {
          session = await storage.read(sessionId);
          if (session.status === 'error') {
            throw new Error(session.error);
          }
          return checkFn(session);
        },
        { interval: 200, timeout, before: false }
      );
      return storage.read(sessionId);
    } catch (err) {
      if (session && session.status !== 'error') {
        throw new CustomError('TimeoutError', `${reason} within ${timeout}ms`);
      }

      err.session = session;
      throw err;
    }
  };

  const waitForAppConnect = (sessionId) =>
    waitForSession(sessionId, (x) => x.requestedClaims.length > 0, 'Requested claims not provided by app');

  const waitForAppApprove = (sessionId) =>
    waitForSession(
      sessionId,
      (x) => typeof x.approveResults[x.currentStep] !== 'undefined',
      'Response claims not handled by app'
    );

  // FIXME: authPrincipal only connect is not supported yet.
  const handleClaimResponse = async (context) => {
    const { sessionId, session, body, locale } = context;
    try {
      if (isValidContext(context) === false) {
        throw new Error('Invalid context');
      }

      if (isSessionFinalized(session)) {
        throw new Error('Session finalized');
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

      // If wallet is submitting authPrincipal claim,
      // move to walletConnected and wait for appConnected
      // once appConnected we return the first claim
      if (session.status === 'walletScanned') {
        await storage.update(sessionId, {
          status: 'walletConnected',
          currentConnected: { userDid, userPk },
        });
        wsServer.broadcast(sessionId, { status: 'walletConnected', userDid, userPk });

        // If our claims are populated already, move to appConnected without waiting
        if (session.requestedClaims.length > 0) {
          newSession = await storage.update(sessionId, { status: 'appConnected' });
          wsServer.broadcast(sessionId, { status: 'appConnected', requestedClaims: newSession.requestedClaims });
        } else {
          newSession = await waitForAppConnect(sessionId);
          await storage.update(sessionId, { status: 'appConnected' });
          wsServer.broadcast(sessionId, { status: 'appConnected', requestedClaims: newSession.requestedClaims });
        }
        return signClaims(newSession.requestedClaims[session.currentStep], { ...context, session: newSession });
      }

      // Move to walletApproved state and wait for appApproved
      await storage.update(sessionId, {
        status: 'walletApproved',
        responseClaims: [...session.responseClaims, claims],
      });
      wsServer.broadcast(sessionId, {
        status: 'walletApproved',
        responseClaims: claims,
        currentStep: session.currentStep,
      });
      newSession = await waitForAppApprove(sessionId);
      await storage.update(sessionId, { status: 'appApproved' });
      wsServer.broadcast(sessionId, {
        status: 'appApproved',
        approveResult: newSession.approveResults[session.currentStep],
      });

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

      // client error
      if (err.session && err.session.error) {
        wsServer.broadcast(sessionId, { status: 'error', error: err.session.error });
        return signJson({ error: err.session.error }, context);
      }

      // timeout error
      if (err.code === 'TimeoutError') {
        await storage.update(sessionId, { status: 'timeout', error: err.message });
        wsServer.broadcast(sessionId, { status: 'timeout', error: err.message });
        return signJson({ error: err.message }, context);
      }

      // reject error
      if (err.code === 'RejectError') {
        await storage.update(sessionId, { status: 'rejected', currentStep: Math.max(session.currentStep - 1, 0) });
        wsServer.broadcast(sessionId, { status: 'rejected' });
        return signJson({}, context);
      }

      // anything else
      await storage.update(sessionId, { status: 'error', error: err.message });
      wsServer.broadcast(sessionId, { status: 'error', error: err.message });
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
