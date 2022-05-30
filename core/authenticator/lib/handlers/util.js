/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-destructuring */
/* eslint-disable object-curly-newline */
/* eslint-disable consistent-return */
const url = require('url');
const get = require('lodash/get');
const set = require('lodash/set');
const omit = require('lodash/omit');
const semver = require('semver');
const Mcrypto = require('@ocap/mcrypto');
const SealedBox = require('tweetnacl-sealedbox-js');
const stringify = require('json-stable-stringify');
const { isValid: isValidDid } = require('@arcblock/did');
const { stripHexPrefix, toBase64, fromBase64 } = require('@ocap/util');

// Scheme: https://tools.ietf.org/html/rfc3986#section-3.1
// Absolute URL: https://tools.ietf.org/html/rfc3986#section-4.3
const ABSOLUTE_URL_REGEX = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/;
// Windows paths like `c:\`
const WINDOWS_PATH_REGEX = /^[a-zA-Z]:\\/;
const isUrl = (input) => {
  if (typeof input !== 'string') {
    return false;
  }
  if (WINDOWS_PATH_REGEX.test(input)) {
    return false;
  }
  return ABSOLUTE_URL_REGEX.test(input);
};

// eslint-disable-next-line
const debug = require('debug')(`${require('../../package.json').name}:handlers:util`);

const sha3 = Mcrypto.Hasher.SHA3.hash256;
const getLocale = (req) => (req.acceptsLanguages('en-US', 'zh-CN') || 'en-US').split('-').shift();
const getSessionId = () => Date.now().toString();
const noop = () => ({});
const noTouch = (x) => x;

const errors = {
  tokenMissing: {
    en: 'Session Id is required to check status',
    zh: '缺少会话 ID 参数',
  },
  didMismatch: {
    en: 'Login user and wallet user mismatch, please relogin and try again',
    zh: '登录用户和扫码用户不匹配，为保障安全，请重新登录应用',
  },
  challengeMismatch: {
    en: 'Challenge mismatch',
    zh: '随机校验码不匹配',
  },
  token404: {
    en: 'Session not found or expired',
    zh: '会话不存在或已过期',
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

const STATUS_CREATED = 'created';
const STATUS_SUCCEED = 'succeed';
const STATUS_ERROR = 'error';
const STATUS_SCANNED = 'scanned';
const STATUS_FORBIDDEN = 'forbidden';

// This logic exist because the handlers maybe attached to a nested router
// pathname pattern: /:prefix/:action/auth
// But the group of handlers may be attached to a sub router, which has a baseUrl of `/api/login` (can only be extracted from `req.originalUrl`)
// We need to ensure the full url is given to DID Wallet
// eg: `/agent/login/auth` on the current router will be converted to `/api/login/agent/login/auth`
const _preparePathname = (path, req) => {
  const delimiter = path.replace(/\/retrieve$/, '').replace(/\/auth$/, '');
  const fullPath = url.parse(req.originalUrl).pathname;
  const [prefix] = fullPath.split(delimiter);
  const cleanPath = [prefix, path].join('/').replace(/\/+/g, '/');
  // console.log('preparePathname', { path, delimiter, fullPath, prefix, cleanPath });
  return cleanPath;
};

const getBaseUrl = (req) => {
  if (req.headers['x-path-prefix']) {
    return `/${req.headers['x-path-prefix']}/`.replace(/\/+/g, '/');
  }

  return '/';
};

// This makes the lib smart enough to infer baseURL from request object
const prepareBaseUrl = (req, params) => {
  const pathPrefix = getBaseUrl(req).replace(/\/$/, '');
  const [hostname = '', port = 80] = (req.get('x-real-hostname') || req.get('host') || '').split(':');
  // NOTE: x-real-port exist because sometimes the auth api is behind a port-forwarding proxy
  const finalPort = get(params, 'x-real-port', null) || req.get('X-Real-Port') || port || '';
  return url.format({
    protocol:
      get(params, 'x-real-protocol') || req.get('X-Real-protocol') || req.get('X-Forwarded-Proto') || req.protocol,
    hostname,
    port: Number(finalPort) === 80 ? '' : finalPort,
    pathname: pathPrefix,
  });
};

// https://github.com/joaquimserafim/base64-url/blob/54d9c9ede66a8724f280cf24fd18c38b9a53915f/index.js#L10
const unescape = (str) => (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
const decodeEncKey = (str) => new Uint8Array(Buffer.from(unescape(str), 'base64'));

const getStepChallenge = () => stripHexPrefix(Mcrypto.getRandomBytes(16)).toUpperCase();

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

const isDeepLink = (str) => str.startsWith('https://abtwallet.io/i/');

// If we treat an did-connect roundtrip as a session, then action token is the session id
module.exports = function createHandlers({
  action,
  pathname,
  claims,
  onStart,
  onConnect,
  onAuth,
  onDecline,
  onComplete,
  onExpire,
  onError,
  pathTransformer,
  tokenStorage,
  authenticator,
  authPrincipal,
  getSignParams = noop,
  getPathName = noTouch,
  options,
}) {
  const { tokenKey, encKey, cleanupDelay } = options;

  // FIXME: Normalize claims [{ type: 'authPrincipal', key: 'connect', request: fn }]
  const defaultSteps = (Array.isArray(claims) ? claims : [claims]).filter(Boolean);

  // Smart detection of user-defined uthPrincipal claim
  if (defaultSteps.length > 0) {
    const keys = Object.keys(defaultSteps[0]);
    const firstClaim = defaultSteps[0][keys[0]];
    if (Array.isArray(firstClaim)) {
      if (firstClaim[0] === 'authPrincipal') {
        // eslint-disable-next-line no-param-reassign
        authPrincipal = false;
      }
    } else if (keys[0] === 'authPrincipal') {
      // eslint-disable-next-line no-param-reassign
      authPrincipal = false;
    }
  }

  // Prepend default authPrincipal claim if not set
  if (authPrincipal) {
    let target = '';
    let description = 'Please select account to continue.';
    let chainInfo;
    let targetType;
    let declareParams;

    if (typeof authPrincipal === 'string') {
      if (isValidDid(authPrincipal)) {
        // If auth principal is provided as a did
        target = authPrincipal;
      } else {
        // If auth principal is provided as a string
        description = authPrincipal;
      }
    }
    if (typeof authPrincipal === 'object') {
      target = get(authPrincipal, 'target', target);
      description = get(authPrincipal, 'description', description);
      targetType = get(authPrincipal, 'targetType', targetType);
      declareParams = get(authPrincipal, 'declareParams', declareParams);

      // If provided a chainInfo
      if (authPrincipal.chainInfo && authenticator._isValidChainInfo(authPrincipal.chainInfo)) {
        chainInfo = authPrincipal.chainInfo;
      }
      if (authenticator._isValidChainInfo(authPrincipal)) {
        chainInfo = authPrincipal;
      }
    }

    const supervised = defaultSteps.length === 0;
    defaultSteps.unshift({
      authPrincipal: {
        skippable: true,
        description,
        target,
        chainInfo,
        targetType,
        declareParams,
        supervised,
      },
    });
  }

  // Whether we can skip the authPrincipal step safely
  const canSkipConnect = defaultSteps[0] && defaultSteps[0].authPrincipal && defaultSteps[0].authPrincipal.skippable;

  const createExtraParams = (locale, params, extra = {}) => {
    const finalParams = { ...params, ...(extra || {}) };
    return {
      locale,
      action,
      ...Object.keys(finalParams)
        .filter((x) => !['userDid', 'userInfo', 'userSession', 'appSession', 'userPk', 'token'].includes(x))
        .reduce((obj, x) => {
          obj[x] = finalParams[x];
          return obj;
        }, {}),
    };
  };

  const createSessionUpdater =
    (token, params) =>
    async (key, value, secure = false) => {
      const getUpdate = (k, v) => {
        if (secure && params[encKey]) {
          const encrypted = SealedBox.seal(Buffer.from(stringify(v)), decodeEncKey(params[encKey]));
          return { [k]: Buffer.from(encrypted).toString('base64') };
        }

        return { [k]: v };
      };

      // If key is an object, update multiple keys
      if (typeof key === 'object') {
        secure = value; // eslint-disable-line no-param-reassign
        const keys = Object.keys(key);
        const updates = Object.assign(...keys.map((k) => getUpdate(k, key[k])));
        return tokenStorage.update(token, updates);
      }

      return tokenStorage.update(token, getUpdate(key, value));
    };

  const onProcessError = ({ req, res, stage, err }) => {
    const { token, store } = req.context || {};
    if (token) {
      tokenStorage.update(token, { status: STATUS_ERROR, error: err.message });
    }

    res.jsonp({ error: err.message });
    onError({ token, extraParams: get(store, 'extraParams', {}), stage, err });
  };

  const preparePathname = (str, req) => {
    const auto = _preparePathname(str, req);
    const custom = pathTransformer(auto);
    // console.log('preparePathname', { str, auto, custom });
    return custom;
  };

  // For web app
  const generateSession = async (req, res) => {
    try {
      const params = {
        'x-real-port': req.get('x-real-port'),
        'x-real-protocol': req.get('x-real-protocol'),
        connectedDid: get(req, 'cookies.connected_did', ''),
        connectedPk: get(req, 'cookies.connected_pk', ''),
        ...req.body,
        ...req.query,
        ...req.params,
      };

      const token = sha3(getSessionId({ req, action, pathname })).replace(/^0x/, '').slice(0, 8);

      await tokenStorage.create(token, STATUS_CREATED);

      const finalPath = preparePathname(getPathName(pathname, req), req);
      const baseUrl = prepareBaseUrl(req, params);
      const uri = await authenticator.uri({ token, pathname: finalPath, baseUrl, query: {} });

      // Always set currentStep to 0 when generate a new token
      // Since the did of logged in user may be different of the auth did
      const challenge = getStepChallenge();
      const wallet = await authenticator.getWalletInfo({ baseUrl, request: req });
      const appInfo = await authenticator.getAppInfo({ baseUrl, request: req, wallet });
      await tokenStorage.update(token, { currentStep: 0, challenge, extraParams: params, appInfo });
      // debug('generate token', { action, pathname, token });

      const extraParams = createExtraParams(getLocale(req), params);
      const hookParams = {
        req,
        challenge,
        baseUrl,
        deepLink: uri,
        extraParams,
        updateSession: createSessionUpdater(token, extraParams),
        didwallet: parseWalletUA(req.query['user-agent'] || req.headers['user-agent']),
      };

      // The data returned by onStart will be set to extra of response data
      //   {String} extra.connectedDid：The server will notify the connectedDid in wallet to automatically connect (no code scanning is required) (notification is unreliable)
      //   {Boolean} extra.saveConnect: The server tells the app web side to remember the connect session did after the connect is complete
      const extra = await onStart(hookParams);

      res.jsonp({ token, status: STATUS_CREATED, url: uri, appInfo, extra: extra || {} });
    } catch (err) {
      onProcessError({ req, res, stage: 'generate-token', err });
    }
  };

  // For web app
  const checkSession = async (req, res) => {
    try {
      const { locale, token, store, params } = req.context;
      if (!token) {
        res.status(400).json({ error: errors.tokenMissing[locale] });
        return;
      }
      if (!store) {
        res.status(400).json({ error: errors.token404[locale] });
        return;
      }

      if (store.status === STATUS_FORBIDDEN) {
        res.status(403).json({ error: errors.didMismatch[locale] });
        return;
      }

      if (store.status === STATUS_SUCCEED) {
        setTimeout(() => {
          tokenStorage.delete(token).catch(console.error);
        }, cleanupDelay);
        const extraParams = createExtraParams(locale, params, get(store, 'extraParams', {}));
        await onComplete({
          req,
          userDid: store.did,
          userPk: store.pk,
          extraParams,
          updateSession: createSessionUpdater(token, extraParams),
        });
      }

      res.status(200).json(
        Object.keys(store)
          .filter((x) => x !== 'challenge')
          .reduce((acc, key) => {
            acc[key] = store[key];
            return acc;
          }, {})
      );
    } catch (err) {
      onProcessError({ req, res, stage: 'check-token-status', err });
    }
  };

  // For web app
  const expireSession = async (req, res) => {
    try {
      const { locale, token, store } = req.context;
      if (!token) {
        res.status(400).json({ error: errors.tokenMissing[locale] });
        return;
      }
      if (!store) {
        res.status(400).json({ error: errors.token404[locale] });
        return;
      }

      onExpire({ token, extraParams: get(store, 'extraParams', {}), status: 'expired' });

      // We do not delete tokens that are scanned by wallet since it will cause confusing
      if (store.status !== STATUS_SCANNED) {
        await tokenStorage.delete(token);
      }
      res.status(200).json({ token });
    } catch (err) {
      onProcessError({ req, res, stage: 'mark-token-timeout', err });
    }
  };

  // Only check userDid and userPk if we have done auth principal
  const checkUser = async ({ context, userDid, userPk }) => {
    const { locale, token, store } = context;
    const isConnected = store.currentStep > 0;

    // Only check userDid and userPk if we have done auth principal
    if (isConnected) {
      if (!userDid) {
        return errors.didMissing[locale];
      }
      if (!userPk) {
        return errors.pkMissing[locale];
      }

      // check userDid mismatch
      if (userDid !== store.did) {
        await tokenStorage.update(token, { status: STATUS_FORBIDDEN });
        return errors.didMismatch[locale];
      }
    }

    return false;
  };

  // eslint-disable-next-line consistent-return
  const onAuthRequest = async (req, res) => {
    const { locale, token, store, params, didwallet } = req.context;
    const extraParams = createExtraParams(locale, params, get(store, 'extraParams', {}));
    const userDid = params.userDid || store.did || extraParams.connectedDid;
    const userPk = params.userPk || store.pk || extraParams.connectedPk;

    const error = await checkUser({ context: req.context, userDid, userPk });
    if (error) {
      return res.jsonp({ error });
    }

    try {
      const steps = [...defaultSteps];
      const shouldSkipConnect = canSkipConnect && !!extraParams.connectedDid;
      if (shouldSkipConnect) {
        set(steps, '[0].authPrincipal.supervised', false);
      }

      if (store.status !== STATUS_SCANNED) {
        await tokenStorage.update(token, { status: STATUS_SCANNED, connectedWallet: didwallet });
      }

      // Since we can not store dynamic claims anywhere, we should calculate it on the fly
      if (store.dynamic || shouldSkipConnect) {
        const newClaims = await onConnect({
          req,
          userDid,
          userPk,
          didwallet,
          challenge: store.challenge,
          pathname: preparePathname(getPathName(pathname, req), req),
          baseUrl: prepareBaseUrl(req, extraParams),
          extraParams,
          updateSession: createSessionUpdater(token, extraParams),
        });
        if (newClaims) {
          steps.push(newClaims);
        }
      }

      const signParams = await getSignParams(req);
      const signedClaim = await authenticator.sign(
        Object.assign(signParams, {
          context: {
            token,
            userDid,
            userPk,
            didwallet,
          },
          claims: steps[store.currentStep],
          pathname: preparePathname(getPathName(pathname, req), req),
          baseUrl: prepareBaseUrl(req, extraParams),
          extraParams,
          challenge: store.challenge,
          appInfo: store.appInfo,
          request: req,
        })
      );

      res.jsonp(Object.assign(signedClaim, { signed: true }));
    } catch (err) {
      onProcessError({ req, res, stage: 'send-auth-claim', err });
    }
  };

  // eslint-disable-next-line consistent-return
  const onAuthResponse = async (req, res) => {
    const { locale, token, store, params, didwallet } = req.context;

    try {
      const {
        userDid,
        userPk,
        action: userAction,
        challenge: userChallenge,
        claims: claimResponse,
      } = await authenticator.verify(params, locale);
      // debug('onAuthResponse.verify', { userDid, token, claims: claimResponse });

      if (!store.did || !store.pk) {
        await tokenStorage.update(token, { did: userDid, pk: userPk });
      }

      const extraParams = createExtraParams(locale, params, get(store, 'extraParams', {}));
      const cbParams = {
        step: store.currentStep,
        req,
        userDid,
        userPk,
        challenge: store.challenge,
        didwallet,
        claims: claimResponse,
        baseUrl: prepareBaseUrl(req, extraParams),
        extraParams,
        updateSession: createSessionUpdater(token, extraParams),
      };

      const steps = [...defaultSteps];
      const shouldSkipConnect = canSkipConnect && !!extraParams.connectedDid;

      // Since we can not store dynamic claims anywhere, we should calculate it on the fly
      if (store.dynamic || shouldSkipConnect) {
        const newClaims = await onConnect(cbParams);
        if (newClaims) {
          steps.push(newClaims);
        }
      }

      // Ensure user approval
      if (userAction === 'declineAuth') {
        await tokenStorage.update(token, {
          status: STATUS_ERROR,
          error: errors.userDeclined[locale],
          currentStep: steps.length - 1,
        });

        const result = await onDecline(cbParams);
        return res.jsonp({ ...(result || {}) });
      }

      // Ensure JWT challenge match
      if (!userChallenge) {
        return res.jsonp({ error: errors.challengeMismatch[locale] });
      }
      if (userChallenge !== store.challenge) {
        return res.jsonp({ error: errors.challengeMismatch[locale] });
      }

      // Ensure userDid match between authPrincipal and later process
      const error = await checkUser({ context: req.context, userDid, userPk });
      if (error) {
        return res.jsonp({ error });
      }

      const isConnected = store.currentStep > 0;
      if (isConnected === false) {
        // Some permission check login can be done here
        // Error thrown from this callback will terminate the process
        const newClaims = await onConnect(cbParams);
        if (newClaims) {
          await tokenStorage.update(token, { dynamic: true });
          steps.push(newClaims);
        }
      }

      const onLastStep = async (result) => {
        // If we have nextWorkflow, do not mark current session as complete
        // Instead, save the relationship between the two
        // Then, mark both session as complete on nextWorkflow complete
        // In theory, we can use this mechanism to concat infinite sessions
        if (result && result.nextToken && result.nextWorkflow) {
          try {
            await tokenStorage.update(result.nextToken, { prevToken: token });
          } catch (err) {
            console.error('DIDAuth: failed to to update nextToken', err);
            await tokenStorage.update(token, { status: STATUS_SUCCEED });
          }
        } else {
          if (store.prevToken) {
            try {
              await tokenStorage.update(store.prevToken, { status: STATUS_SUCCEED });
            } catch (err) {
              console.error('DIDAuth: failed to to update prevToken', err);
            }
          }
          await tokenStorage.update(token, { status: STATUS_SUCCEED });
        }

        let nextWorkflow = isUrl(cbParams.extraParams.nw) ? cbParams.extraParams.nw : '';
        if (nextWorkflow && result && result.nextWorkflowData) {
          const tmp = new URL(nextWorkflow);
          const previousWorkflowData = toBase64(JSON.stringify(result.nextWorkflowData));
          if (previousWorkflowData.length > 1024) {
            const err = new Error('base64 encoded nextWorkflowData should be less than 1024 characters');
            return onProcessError({ req, res, stage: 'append-next-workflow', err });
          }

          if (isDeepLink(nextWorkflow)) {
            const actualUrl = decodeURIComponent(tmp.searchParams.get('url'));
            const obj = new URL(actualUrl);
            obj.searchParams.set('previousWorkflowData', previousWorkflowData);
            tmp.searchParams.set('url', obj.href);
          } else {
            tmp.searchParams.set('previousWorkflowData', previousWorkflowData);
          }

          nextWorkflow = tmp.href;
        }

        return res.jsonp({ ...Object.assign({ nextWorkflow }, result || {}) });
      };

      // If we are only requesting the authPrincipal claim
      // We make such assertion here, because the onConnect callback can modify the steps
      if (steps.length === 1) {
        const result = await onAuth(cbParams);
        return onLastStep(result);
      }

      // If we got requestedClaims other than the authPrincipal
      if (isConnected && store.currentStep < steps.length) {
        // Call onAuth on each step, since we do not hold all results until complete
        const result = await onAuth(cbParams);

        // Only return if we are walked through all steps
        const isLastStep = store.currentStep === steps.length - 1;
        if (isLastStep) {
          return onLastStep(result);
        }
      }

      // Move to next step: nextStep is persisted here to avoid an memory storage error
      const nextStep = store.currentStep + 1;
      const nextChallenge = getStepChallenge();
      await tokenStorage.update(token, { currentStep: nextStep, challenge: nextChallenge });
      const signParams = await getSignParams(req);

      try {
        const nextSignedClaim = await authenticator.sign(
          Object.assign(signParams, {
            context: {
              token,
              userDid,
              userPk,
              didwallet,
            },
            claims: steps[nextStep],
            pathname: preparePathname(getPathName(pathname, req), req),
            baseUrl: prepareBaseUrl(req, extraParams),
            extraParams,
            challenge: nextChallenge,
            appInfo: store.appInfo,
            request: req,
          })
        );
        return res.jsonp(Object.assign(nextSignedClaim, { signed: true }));
      } catch (err) {
        return onProcessError({ req, res, stage: 'next-auth-claim', err });
      }
    } catch (err) {
      onProcessError({ req, res, stage: 'verify-auth-claim', err });
    }
  };

  const ensureContext = async (req, res, next) => {
    const didwallet = parseWalletUA(req.query['user-agent'] || req.headers['user-agent']);
    const params = { ...req.body, ...req.query, ...req.params };
    const token = params[tokenKey];
    const locale = getLocale(req);

    let store = null;
    if (token) {
      store = await tokenStorage.read(token);
      if (params.previousWorkflowData) {
        try {
          store.extraParams.previousWorkflowData = JSON.parse(fromBase64(params.previousWorkflowData));
          await tokenStorage.update(token, { extraParams: store.extraParams });
        } catch (e) {
          console.warn('Could not parse previousWorkflowData', params.previousWorkflowData, e);
        }
      }
    }

    req.context = { locale, token, didwallet, params, store };
    return next();
  };

  const ensureSignedJson = (req, res, next) => {
    if (req.ensureSignedJson === undefined) {
      req.ensureSignedJson = true;
      const originJsonp = res.jsonp;
      res.jsonp = async (payload) => {
        if (payload.signed) {
          return originJsonp.call(res, payload);
        }

        const data = payload.response ? { response: payload.response } : { response: payload };

        // Attach protocol fields to the root
        if (payload.error || payload.errorMessage) {
          data.errorMessage = payload.error || payload.errorMessage;
        }
        if (payload.successMessage) {
          data.successMessage = payload.successMessage;
        }
        if (payload.nextWorkflow) {
          data.nextWorkflow = payload.nextWorkflow;
        }

        // Remove protocol fields from the response
        const fields = ['error', 'errorMessage', 'successMessage', 'nextWorkflow'];
        if (typeof data.response === 'object') {
          data.response = omit(data.response, fields);
        }

        const params = { ...req.body, ...req.query, ...req.params };
        const token = params[tokenKey];
        const store = token ? await tokenStorage.read(token) : null;

        const signedData = await authenticator.signResponse(
          data,
          prepareBaseUrl(req, get(store, 'extraParams', {})),
          req
        );
        // debug('ensureSignedJson.do', signed);
        originJsonp.call(res, signedData);
      };
    }

    const { token, store, locale } = req.context;
    if (!token || !store) {
      return res.jsonp({ error: errors.token404[locale] });
    }

    next();
  };

  return {
    generateSession,
    expireSession,
    checkSession,
    onAuthRequest,
    onAuthResponse,
    ensureContext,
    ensureSignedJson,
    createExtraParams,
  };
};

module.exports.isDeepLink = isDeepLink;
module.exports.parseWalletUA = parseWalletUA;
module.exports.preparePathname = _preparePathname;
module.exports.prepareBaseUrl = prepareBaseUrl;
module.exports.getStepChallenge = getStepChallenge;
