/* eslint-disable object-curly-newline */
// eslint-disable-next-line
const debug = require('debug')(`${require('../../package.json').name}:handlers:wallet`);

const createHandlers = require('./util');
const BaseHandler = require('./base');

const noop = () => {};

/**
 * Events that are emitted during an did-auth process
 *
 *  - scanned: when the qrcode is scanned by wallet
 *  - succeed: when authentication complete
 *  - error: when something goes wrong
 *
 * @class WalletHandlers
 * @extends {EventEmitter}
 */
class WalletHandlers extends BaseHandler {
  /**
   * Creates an instance of DID Auth Handlers.
   *
   * @class
   * @param {object} config
   * @param {object} config.tokenStorage - function to generate action token
   * @param {object} config.authenticator - Authenticator instance that can to jwt sign/verify
   * @param {function} [config.pathTransformer=null] - how should we update pathname
   * @param {function} [config.onConnect=noop] - function called before each auth request send back to app, used to check for permission, throw error to halt the auth process
   * @param {object} [config.options={}] - custom options to define all handlers attached
   * @param {string} [config.options.prefix='/api/did'] - url prefix for this group endpoints
   * @param {number} [config.options.cleanupDelay=60000] - how long to wait before cleanup finished session
   * @param {string} [config.options.tokenKey='_t_'] - query param key for `token`
   * @param {string} [config.options.encKey='_ek_'] - query param key for `token`
   */
  constructor({ pathTransformer, tokenStorage, authenticator, onConnect = noop, options = {} }) {
    super({ pathTransformer, tokenStorage, authenticator, onConnect });

    this.options = {
      prefix: '/api/did',
      cleanupDelay: 60000,
      tokenKey: '_t_',
      encKey: '_ek_',
      ...options,
    };
  }

  /**
   * Attach routes and handlers for authenticator
   * Now express app have route handlers attached to the following url
   * - `GET /api/did/{action}/token` create new token
   * - `GET /api/did/{action}/status` check for token status
   * - `GET /api/did/{action}/timeout` expire a token
   * - `GET /api/did/{action}/auth` create auth response
   * - `POST /api/did/{action}/auth` process payment request
   *
   * @method
   * @param {object} config
   * @param {object} config.app - express instance to attach routes to
   * @param {object} config.claims - claims for this request
   * @param {string} config.action - action of this group of routes
   * @param {function} [config.onStart=noop] - callback when a new action start
   * @param {function} [config.onConnect=noop] - callback when a new action start
   * @param {function} config.onAuth - callback when user completed auth in DID Wallet, and data posted back
   * @param {function} [config.onDecline=noop] - callback when user has declined in wallet
   * @param {function} [config.onComplete=noop] - callback when the whole auth process is done, action token is removed
   * @param {function} [config.onExpire=noop] - callback when the action token expired
   * @param {function} [config.onError=console.error] - callback when there are some errors
   * @param {boolean|string|did} [config.authPrincipal=true] - whether should we do auth principal claim first
   * @return void
   */
  attach({
    app,
    action,
    claims,
    onStart = noop,
    onConnect,
    onAuth,
    onDecline = noop,
    onComplete = noop,
    onExpire = noop,
    // eslint-disable-next-line no-console
    onError = console.error,
    authPrincipal = true,
  }) {
    if (typeof onAuth !== 'function') {
      throw new Error('onAuth callback is required to attach did auth handlers');
    }
    if (typeof onDecline !== 'function') {
      throw new Error('onDecline callback is required to attach did auth handlers');
    }
    if (typeof onComplete !== 'function') {
      throw new Error('onComplete callback is required to attach did auth handlers');
    }

    const { prefix } = this.options;

    // pathname for DID Wallet, which will be included for authenticator signing
    const pathname = `${prefix}/${action}/auth`;
    debug('attach routes', { action, prefix, pathname });

    // eslint-disable-next-line consistent-return
    const onConnectWrapped = async (...args) => {
      if (typeof this.onConnect === 'function') {
        await this.onConnect(...args);
      }
      if (typeof onConnect === 'function') {
        return onConnect(...args);
      }
    };

    const {
      generateSession,
      expireSession,
      checkSession,
      onAuthRequest,
      onAuthResponse,
      ensureContext,
      ensureSignedJson,
    } = createHandlers({
      action,
      pathname,
      claims,
      onStart,
      onConnect: onConnectWrapped, // must be deterministic when returning dynamic claims
      onAuth,
      onDecline,
      onComplete,
      onExpire,
      onError,
      authPrincipal,
      options: this.options,
      pathTransformer: this.pathTransformer,
      tokenStorage: this.tokenStorage,
      authenticator: this.authenticator,
    });

    // 1. WEB|Wallet: to generate new token
    app.get(`${prefix}/${action}/token`, generateSession);
    app.post(`${prefix}/${action}/token`, generateSession);

    // 2. WEB: check for token status
    app.get(`${prefix}/${action}/status`, ensureContext, checkSession);

    // 3. WEB: to expire old token
    app.get(`${prefix}/${action}/timeout`, ensureContext, expireSession);

    // 4. Wallet: fetch auth request
    app.get(pathname, ensureContext, ensureSignedJson, onAuthRequest);

    // 5. Wallet: submit auth response
    app.post(pathname, ensureContext, ensureSignedJson, onAuthResponse);

    // 6. Wallet: submit auth response for web wallet
    app.get(`${pathname}/submit`, ensureContext, ensureSignedJson, onAuthResponse);
  }
}

module.exports = WalletHandlers;
