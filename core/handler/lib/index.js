const uuid = require('uuid');
const semver = require('semver');
const omit = require('lodash/omit');
const pick = require('lodash/pick');
const waitFor = require('p-wait-for');
const Jwt = require('@arcblock/jwt');
const objectHash = require('object-hash');
const { WsServer } = require('@arcblock/ws');
const { isValid } = require('@arcblock/did');
const { getRandomBytes } = require('@ocap/mcrypto');
const { toBase58, stripHexPrefix } = require('@ocap/util');

const getStepChallenge = () => stripHexPrefix(getRandomBytes(16)).toUpperCase();

const parseWalletUA = (userAgent) => {
  const ua = (userAgent || '').toString().toLowerCase();
  let os = '';
  let version = '';
  if (ua.indexOf('android') > -1) {
    os = 'android';
  } else if (ua.indexOf('darwin') > -1) {
    os = 'ios';
  } else if (ua.indexOf('arcwallet') === 0) {
    os = 'web';
  }

  const match = ua.split(/\s+/).find((x) => x.startsWith('arcwallet'));
  if (match) {
    const tmp = match.split('/');
    if (tmp.length > 1 && semver.coerce(tmp[1])) {
      version = semver.coerce(tmp[1]).version;
    }
  }

  // NOTE: for ios v2.7.2+ and android v2.7.16+, we should adopt jwt v1.1
  let jwt = '1.0.0';
  if (os === 'ios' && version && semver.gte(version, '2.7.2')) {
    jwt = '1.1.0';
  } else if (os === 'android' && version && semver.gte(version, '2.7.16')) {
    jwt = '1.1.0';
  } else if (os === 'web') {
    jwt = '1.1.0';
  }

  return { os, version, jwt };
};

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

function createHandlers({
  wallet,
  authenticator,
  sessionStorage,
  logger = console,
  socketPathname = '/connect/relay/websocket',
}) {
  const wsServer = createSocketServer(logger, socketPathname);

  const isSessionFinalized = (x) => ['error', 'timeout', 'canceled', 'rejected'].includes(x.status);
  const isValidContext = (x) => !!x;

  const signJson = (data, context) => {
    const final = data.response ? { response: data.response } : { response: data };

    // Attach protocol fields to the root
    if (data.error || data.errorMessage) {
      final.errorMessage = data.error || data.errorMessage;
    }
    if (data.successMessage) {
      final.successMessage = data.successMessage;
    }
    if (data.nextWorkflow) {
      final.nextWorkflow = data.nextWorkflow;
    }

    // Remove protocol fields from the response
    const fields = ['error', 'errorMessage', 'successMessage', 'nextWorkflow'];
    if (typeof data.response === 'object') {
      final.response = omit(data.response, fields);
    }

    const { response = {}, errorMessage = '', successMessage = '', nextWorkflow = '' } = final;
    const { didwallet, session } = context;

    return {
      appPk: toBase58(wallet.publicKey),
      authInfo: Jwt.sign(
        wallet.address,
        wallet.secretKey,
        {
          appInfo: session.appInfo,
          status: errorMessage ? 'error' : 'ok',
          errorMessage: errorMessage || '',
          successMessage: successMessage || '',
          nextWorkflow: nextWorkflow || '',
          response,
        },
        true,
        didwallet ? didwallet.jwt : undefined
      ),
    };
  };

  const signClaims = (claims, context) => {
    const { sessionId, session, didwallet } = context;
    const { authUrl, challenge, appInfo } = session;

    const tmp = new URL(authUrl);
    tmp.searchParams.set('sid', sessionId);
    const nextUrl = tmp.href;

    const payload = {
      action: 'responseAuth',
      challenge,
      appInfo,
      chainInfo: { host: 'none', id: 'none' }, // FIXME: get chainInfo from claim
      requestedClaims: claims, // FIXME: validate using schema?
      url: nextUrl,
    };

    return {
      appPk: toBase58(wallet.publicKey),
      authInfo: Jwt.sign(wallet.address, wallet.secretKey, payload, true, didwallet.jwt),
      signed: true,
    };
  };

  const handleSessionCreate = async (context) => {
    if (isValidContext(context)) {
      return { error: 'Context invalid', code: 400 };
    }

    const { sessionId, updaterPk, strategy = 'default', authUrl } = context.body;

    if (uuid.validate(sessionId) === false) {
      return { error: 'Invalid session id', code: 400 };
    }
    if (updaterPk !== context.signerPk) {
      return { error: 'Invalid session updater', code: 400 };
    }

    return sessionStorage.create(sessionId, {
      status: 'created',
      updaterPk,
      strategy,
      // the client shall compose the deep-link by itself, since the rules are simple enough
      authUrl,
      challenge: getStepChallenge(),
      // FIXME: fix this in most cases
      appInfo: await authenticator.getAppInfo({ request: context.req, baseUrl: new URL(authUrl).origin, wallet }),
      previousConnected: context.previousConnected,
      currentConnected: null,
      currentStep: 0,
      requestedClaims: [], // app requested claims, authPrincipal should not be listed here
      responseClaims: [], // wallet submitted claims
      approveResults: [],
      error: '',
    });
  };

  const handleSessionRead = async (sessionId) => {
    // TODO: remove the session after complete/expire/canceled/rejected
    return sessionStorage.read(sessionId);
  };

  const handleSessionUpdate = (context) => {
    if (isValidContext(context)) {
      return { error: 'Context invalid', code: 400 };
    }

    if (isSessionFinalized(context.session)) {
      return { error: 'Session is finalized and can not be updated', code: 400 };
    }

    const { body, session, signerPk, signatureToken } = context;
    if (body.status && ['error'].includes(body.status) === false) {
      return { error: 'Invalid session status', code: 400 };
    }

    if (session.updaterPk !== context.signerPk) {
      return { error: 'Invalid updater', code: 400 };
    }

    if (!signerPk) {
      return { error: 'Invalid updater pk', code: 400 };
    }
    if (!signatureToken) {
      return { error: 'Invalid token', code: 400 };
    }

    if (Jwt.verify(signatureToken, signerPk) === false) {
      return { error: 'Invalid updater signature', code: 400 };
    }

    const hash = objectHash(body);
    const decoded = Jwt.decode(signatureToken);
    if (decoded.hash !== hash) {
      return { error: 'Invalid payload hash', code: 400 };
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

    logger.info('update session', context.sessionId, body, updates);
    return sessionStorage.update(context.sessionId, updates);
  };

  const handleClaimRequest = async (context) => {
    if (isValidContext(context)) {
      return signJson({ error: 'Context invalid', code: 400 });
    }

    const { sessionId, session, didwallet } = context;
    const { strategy, requestedClaims, previousConnected, currentStep } = session;
    try {
      if (isSessionFinalized(session)) {
        return signJson({ error: 'Session is finalized', code: 400 });
      }

      // if we are in created status, we should return authPrincipal claim
      if (session.status === 'created') {
        // If our claims are populated already, move to appConnected
        if (requestedClaims.length > 0) {
          await sessionStorage.update(sessionId, { status: 'appConnected' });
        } else {
          wsServer.broadcast(sessionId, { status: 'walletScanned', didwallet });
          await sessionStorage.update(sessionId, { status: 'walletScanned' });
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
      await sessionStorage.update(sessionId, { status: 'error', error: err.message });
      return signJson({ error: err.message }, context);
    }
  };

  const handleClaimResponse = async (context) => {
    if (isValidContext(context)) {
      return signJson({ error: 'Context invalid', code: 400 });
    }

    const { sessionId, session, body, locale } = context;
    try {
      if (isSessionFinalized(session)) {
        return signJson({ error: 'Session is finalized', code: 400 });
      }

      const { userDid, userPk, action, challenge, claims } = await authenticator.verify(body, locale);
      const waitForSession = (fn) =>
        waitFor(
          async () => {
            const newSession = await sessionStorage.read(sessionId);
            return fn(newSession);
          },
          { interval: 200, timeout: 20 * 1000, before: false }
        ).then(() => sessionStorage.read(sessionId));

      // Ensure user approval
      if (action === 'declineAuth') {
        await sessionStorage.update(sessionId, {
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
        await sessionStorage.update(sessionId, {
          status: 'walletConnected',
          currentConnected: { userDid, userPk },
        });
        wsServer.broadcast(sessionId, { status: 'walletConnected', userDid, userPk });

        const newSession = await waitForSession((s) => s.status === 'error' || s.requestedClaims.length > 0);
        if (newSession.status === 'error') {
          wsServer.broadcast(sessionId, { status: 'error' });
          return signJson({ error: newSession.error }, context);
        }

        await sessionStorage.update(sessionId, { status: 'appConnected' });
        return signClaims(newSession.requestedClaims[session.currentStep], { ...context, session: newSession });
      }

      // FIXME: authPrincipal only connect is not supported yet.

      // Move to walletApproved state and wait for appApproved
      await sessionStorage.update(sessionId, {
        status: 'walletApproved',
        responseClaims: [...session.responseClaims, claims],
      });
      wsServer.broadcast(sessionId, { status: 'walletApproved', claims, currentStep: session.currentStep });
      let newSession = await waitForSession(
        (s) => s.status === 'error' || typeof s.approveResults[session.currentStep] !== 'undefined'
      );
      if (newSession.status !== 'error') {
        await sessionStorage.update(sessionId, { status: 'appApproved' });
      }

      // Return result if we've done
      const isDone = session.currentStep === session.requestedClaims.length - 1;
      if (isDone) {
        if (newSession.status === 'error') {
          wsServer.broadcast(sessionId, { status: 'error' });
          return signJson({ error: newSession.error }, context);
        }

        await sessionStorage.update(sessionId, { status: 'completed' });
        wsServer.broadcast(sessionId, { status: 'completed' });
        return signJson(newSession.approveResults[session.currentStep], context);
      }

      // Move on to next step if we are not the last step
      const nextStep = session.currentStep + 1;
      const nextChallenge = getStepChallenge();
      newSession = await sessionStorage.update(sessionId, { currentStep: nextStep, challenge: nextChallenge });
      return signClaims(session.requestedClaims[nextStep], { ...context, session: newSession });
    } catch (err) {
      logger.error(err);
      await sessionStorage.update(sessionId, { status: 'error', error: err.message });
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
  };
}

module.exports = { createHandlers, parseWalletUA, getStepChallenge };
