const uuid = require('uuid');
const get = require('lodash/get');

module.exports = (router, handlers, prefix = '/connect/relay') => {
  const {
    handleSessionCreate,
    handleSessionRead,
    handleSessionUpdate,
    handleClaimRequest,
    handleClaimResponse,
    parseWalletUA,
  } = handlers;

  const getPreviousConnected = (req) => {
    const userDid = get(req, 'cookies.connected_did', '');

    if (userDid) {
      return {
        userDid,
        userPk: get(req, 'cookies.connected_pk', ''),
        wallet: get(req, 'cookies.connected_wallet', ''),
      };
    }

    return null;
  };

  const ensureContext = async (req, res, next) => {
    const sessionId = req.query.sid;
    if (!sessionId) {
      return res.status(400).jsonp({ error: 'No session id' });
    }
    if (uuid.validate(sessionId) === false) {
      return res.status(400).jsonp({ error: 'Invalid session id' });
    }

    const session = await handleSessionRead(sessionId);
    if (!session) {
      return res.status(400).jsonp({ error: 'Session not found' });
    }

    // extra context
    const didwallet = parseWalletUA(req.query['user-agent'] || req.headers['user-agent']);
    const locale = (req.acceptsLanguages('en-US', 'zh-CN') || 'en-US').split('-').shift();

    req.context = {
      didwallet,
      body: req.body,
      sessionId,
      session,
      locale,
      previousConnected: getPreviousConnected(req),
    };

    return next();
  };

  // web: create new session
  router.post(`${prefix}/session`, ensureContext, async (req, res) => {
    const result = await handleSessionCreate(req.context);
    res.jsonp(result);
  });

  // web: get session
  router.get(`${prefix}/session`, ensureContext, (req, res) => {
    res.jsonp(req.context.session);
  });

  // web: update session
  router.put(`${prefix}/session`, ensureContext, async (req, res) => {
    const result = await handleSessionUpdate(req.context);
    res.jsonp(result);
  });

  // wallet: get requested claims
  router.get(`${prefix}/auth`, ensureContext, async (req, res) => {
    const result = await handleClaimRequest(req.context);
    res.jsonp(result);
  });

  // Wallet: submit requested claims
  router.post(`${prefix}/auth`, ensureContext, async (req, res) => {
    const result = await handleClaimResponse(req.context);
    res.jsonp(result);
  });

  // Wallet: submit auth response for web wallet
  router.get(`${prefix}/auth/submit`, ensureContext, async (req, res) => {
    const result = await handleClaimResponse(req.context);
    res.jsonp(result);
  });
};
