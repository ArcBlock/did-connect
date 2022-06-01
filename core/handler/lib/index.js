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

const { getStepChallenge, parseWalletUA, formatDisplay } = require('./util');

const errors = {
  sessionIdMissing: {
    en: 'Session Id is required to check status',
    zh: '缺少会话 ID 参数',
  },
  sessionNotFound: {
    en: 'Session not found or expired',
    zh: '会话不存在或已过期',
  },
  didMismatch: {
    en: 'Login user and wallet user mismatch, please relogin and try again',
    zh: '登录用户和扫码用户不匹配，为保障安全，请重新登录应用',
  },
  challengeMismatch: {
    en: 'Challenge mismatch',
    zh: '随机校验码不匹配',
  },
  didMissing: {
    en: 'userDid is required to start auth',
    zh: 'userDid 参数缺失，请勿尝试连接多个不同的钱包',
  },
  pkMissing: {
    en: 'userPk is required to start auth',
    zh: 'userPk 参数缺失，请勿尝试连接多个不同的钱包',
  },
  authClaim: {
    en: 'authPrincipal claim is not configured correctly',
    zh: 'authPrincipal 声明配置不正确',
  },
  userDeclined: {
    en: 'You have declined the authentication request',
    zh: '授权请求被拒绝',
  },
};

function createSocketServer(logger, pathname) {
  return new WsServer({ logger, pathname });
}

function createHandlers({ storage, authenticator, logger = console, socketPathname = '/connect/relay/websocket' }) {
  const wsServer = createSocketServer(logger, socketPathname);

  const isSessionFinalized = (x) => ['error', 'timeout', 'canceled', 'rejected'].includes(x.status);
  const isValidContext = (x) => {
    const { error } = contextSchema.validate(x);
    if (error) {
      logger.error(error);
    }
    return !error;
  };

  const signJson = authenticator.signJson.bind(authenticator);
  const signClaims = authenticator.signClaims.bind(authenticator);

  const verifyUpdater = (params, updaterPk) => {
    const { body, signerPk, signerToken } = params;
    if (body.status && ['error'].includes(body.status) === false) {
      return { error: 'Invalid session status', code: 400 };
    }

    if (updaterPk && updaterPk !== signerPk) {
      return { error: 'Invalid updater', code: 400 };
    }

    if (!signerPk) {
      return { error: 'Invalid updater pk', code: 400 };
    }
    if (!signerToken) {
      return { error: 'Invalid token', code: 400 };
    }

    if (Jwt.verify(signerToken, signerPk) === false) {
      return { error: 'Invalid updater signature', code: 400 };
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
      return { error: 'Context invalid', code: 400 };
    }

    const { sessionId, updaterPk, strategy = 'default', authUrl } = context.body;

    if (uuid.validate(sessionId) === false) {
      return { error: 'Invalid session id', code: 400 };
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
      appInfo: await authenticator.getAppInfo({ ...context, baseUrl: new URL(authUrl).origin }),
      previousConnected: context.previousConnected,
      currentConnected: null,
      currentStep: 0,
      requestedClaims: [], // app requested claims, authPrincipal should not be listed here
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
    // TODO: remove the session after complete/expire/canceled/rejected
    return storage.read(sessionId);
  };

  const handleSessionUpdate = (context) => {
    if (isValidContext(context) === false) {
      return { error: 'Context invalid', code: 400 };
    }

    if (isSessionFinalized(context.session)) {
      return { error: 'Session is finalized and can not be updated', code: 400 };
    }

    const { body, session } = context;
    const result = verifyUpdater(context, session.updaterPk);
    if (result.error) {
      return result;
    }

    const updates = pick(body, ['error', 'status', 'approveResults', 'requestedClaims']);
    if (updates.error && typeof updates.error !== 'string') {
      return { error: 'Invalid error message', code: 400 };
    }
    if (updates.approveResults && Array.isArray(updates.approveResults) === false) {
      return { error: 'Invalid approveResults', code: 400 };
    }
    if (updates.requestedClaims && Array.isArray(updates.requestedClaims) === false) {
      return { error: 'Invalid requestedClaims', code: 400 };
    }

    logger.info('update session', context.sessionId, body);

    const { error } = sessionSchema.validate({ ...session, ...updates });
    if (error) {
      return { error: `Invalid session: ${error.details.map((x) => x.message).join(', ')}`, code: 400 };
    }

    return storage.update(context.sessionId, updates);
  };

  const handleClaimRequest = async (context) => {
    if (isValidContext(context) === false) {
      return signJson({ error: 'Context invalid', code: 400 }, context);
    }

    const { sessionId, session, didwallet } = context;
    const { strategy, requestedClaims, previousConnected, currentStep } = session;
    try {
      if (isSessionFinalized(session)) {
        return signJson({ error: 'Session is finalized', code: 400 }, context);
      }

      // if we are in created status, we should return authPrincipal claim
      if (session.status === 'created') {
        // If our claims are populated already, move to appConnected
        if (requestedClaims.length > 0) {
          await storage.update(sessionId, { status: 'appConnected' });
          wsServer.broadcast(sessionId, { status: 'appConnected' });
        } else {
          wsServer.broadcast(sessionId, { status: 'walletScanned', didwallet });
          await storage.update(sessionId, { status: 'walletScanned' });
        }

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

  const handleClaimResponse = async (context) => {
    if (isValidContext(context) === false) {
      return signJson({ error: 'Context invalid', code: 400 }, context);
    }

    const { sessionId, session, body, locale } = context;
    try {
      if (isSessionFinalized(session)) {
        return signJson({ error: 'Session is finalized', code: 400 }, context);
      }

      const { userDid, userPk, action, challenge, claims } = await authenticator.verify(body, locale);
      const waitForSession = (fn) =>
        waitFor(
          async () => {
            const newSession = await storage.read(sessionId);
            return fn(newSession);
          },
          { interval: 200, timeout: 20 * 1000, before: false }
        ).then(() => storage.read(sessionId));

      // Ensure user approval
      if (action === 'declineAuth') {
        await storage.update(sessionId, {
          status: 'rejected',
          error: errors.userDeclined[locale],
          currentStep: Math.max(session.currentStep - 1, 0),
        });

        return signJson({}, context);
      }

      // Ensure challenge match
      if (!challenge) {
        return signJson({ error: errors.challengeMismatch[locale] }, context);
      }
      if (challenge !== session.challenge) {
        return signJson({ error: errors.challengeMismatch[locale] }, context);
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

        const newSession = await waitForSession((s) => s.status === 'error' || s.requestedClaims.length > 0);
        if (newSession.status === 'error') {
          wsServer.broadcast(sessionId, { status: 'error' });
          return signJson({ error: newSession.error }, context);
        }

        await storage.update(sessionId, { status: 'appConnected' });
        return signClaims(newSession.requestedClaims[session.currentStep], { ...context, session: newSession });
      }

      // FIXME: authPrincipal only connect is not supported yet.

      // Move to walletApproved state and wait for appApproved
      await storage.update(sessionId, {
        status: 'walletApproved',
        responseClaims: [...session.responseClaims, claims],
      });
      wsServer.broadcast(sessionId, { status: 'walletApproved', claims, currentStep: session.currentStep });
      let newSession = await waitForSession(
        (s) => s.status === 'error' || typeof s.approveResults[session.currentStep] !== 'undefined'
      );
      if (newSession.status !== 'error') {
        await storage.update(sessionId, { status: 'appApproved' });
        wsServer.broadcast(sessionId, { status: 'appApproved' });
      }

      // Return result if we've done
      const isDone = session.currentStep === session.requestedClaims.length - 1;
      if (isDone) {
        if (newSession.status === 'error') {
          wsServer.broadcast(sessionId, { status: 'error' });
          return signJson({ error: newSession.error }, context);
        }

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

module.exports = { createHandlers, parseWalletUA, getStepChallenge, formatDisplay };
