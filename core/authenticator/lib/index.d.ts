// Generate by [js2dts@0.3.3](https://github.com/whxaxes/js2dts#readme)

import * as events from 'events';
declare class BaseAuthenticator {
}
declare class WalletAuthenticator extends BaseAuthenticator {
  wallet: any;
  appInfo: any;
  chainInfo: any;
  baseUrl: any;
  tokenKey: any;
  timeout: any;
  /**
   * @typedef ApplicationInfo
   * @prop {string} name - application name
   * @prop {string} description - application description
   * @prop {string} icon - application icon/logo url
   * @prop {string} link - application home page, with which user can return application from wallet
   * @prop {string} path - deep link url
   * @prop {string} publisher - application did with `did:abt:` prefix
   */

  /**
   * @typedef ChainInfo
   * @prop {string} id - application chain id
   * @prop {string} host - graphql endpoint of the application chain
   * @prop {boolean} restrictedDeclare - whether the declaration is restricted
   */

  /**
   * Creates an instance of DID Authenticator.
   *
   * @class
   * @param {object} config
   * @param {Wallet|Function} config.wallet - wallet instance {@see @ocap/wallet} or a function that returns wallet instance
   * @param {ApplicationInfo|Function} config.appInfo - application basic info or a function that returns application info
   * @param {ChainInfo|Function} config.chainInfo - application chain info or a function that returns chain info
   * @param {Number} [config.timeout=8000] - timeout in milliseconds when generating claim
   * @param {object} [config.baseUrl] - url to assemble wallet request uri, can be inferred from request object
   * @param {string} [config.tokenKey='_t_'] - query param key for `token`
   * @example
   * const { fromRandom } = require('@ocap/wallet');
   *
   * const wallet = fromRandom().toJSON();
   * const chainHost = 'https://beta.abtnetwork.io/api';
   * const chainId = 'beta';
   * const auth = new Authenticator({
   *   wallet,
   *   baseUrl: 'http://beta.abtnetwork.io/webapp',
   *   appInfo: {
   *     name: 'DID Wallet Demo',
   *     description: 'Demo application to show the potential of DID Wallet',
   *     icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
   *   },
   *   chainInfo: {
   *     host: chainHost,
   *     id: chainId,
   *   },
   *   timeout: 8000,
   * });
   */
  constructor(T100: _Lib.T101);
  /**
   * Generate a deep link url that can be displayed as QRCode for DID Wallet to consume
   *
   * @method
   * @param {object} params
   * @param {string} params.token - action token
   * @param {string} params.baseUrl - baseUrl inferred from request object
   * @param {string} params.pathname - wallet callback pathname
   * @param {object} params.query - params that should be persisted in wallet callback url
   * @returns {string}
   */
  uri(T102?: _Lib.T103): string;
  /**
   * Compute public url to return to wallet
   *
   * @method
   * @param {string} pathname
   * @param {object} params
   * @returns {string}
   */
  getPublicUrl(pathname: string, params?: any, baseUrl?: string): string;
  /**
   * Sign a plain response, usually on auth success or error
   *
   * @method
   * @param {object} params
   * @param {object} params.response - response
   * @param {string} params.errorMessage - error message, default to empty
   * @param {string} params.successMessage - success message, default to empty
   * @param {string} params.nextWorkflow - https://github.com/ArcBlock/ABT-DID-Protocol#concatenate-multiple-workflow
   * @param {string} baseUrl
   * @param {object} request
   * @returns {object} { appPk, authInfo }
   */
  signResponse(T104: _Lib.T105, baseUrl: string, request: any): any;
  /**
   * Sign a auth response that returned to wallet: tell the wallet the appInfo/chainInfo
   *
   * @method
   * @param {object} params
   * @param {object} params.claims - info required by application to complete the auth
   * @param {object} params.pathname - pathname to assemble callback url
   * @param {object} params.challenge - random challenge to be included in the body
   * @param {object} params.extraParams - extra query params and locale
   * @param {string} params.context.token - action token
   * @param {string} params.context.userDid - decoded from req.query, base58
   * @param {string} params.context.userPk - decoded from req.query, base58
   * @param {string} params.context.didwallet - DID Wallet os and version
   * @returns {object} { appPk, authInfo }
   */
  sign(T106: _Lib.T107): any;
  /**
   * Determine chainInfo on the fly
   *
   * @param {object} params - contains the context of this request
   * @param {object|undefined} info - chain info object or function
   * @returns {ChainInfo}
   * @memberof WalletAuthenticator
   */
  getChainInfo(params: any, info: any): ChainInfo;
  /**
   * Determine appInfo on the fly
   *
   * @param {object} params - contains the context of this request
   * @param {object|undefined} info - app info object or function
   * @returns {ApplicationInfo}
   * @memberof WalletAuthenticator
   */
  getAppInfo(params: any): ApplicationInfo;
  getWalletInfo(params: any): Promise<any>;
  /**
   * Verify a DID auth response sent from DID Wallet
   *
   * @method
   * @param {object} data
   * @param {string} [locale=en]
   * @param {boolean} [enforceTimestamp=true]
   * @returns Promise<boolean>
   */
  verify(data: any, locale?: string, enforceTimestamp?: boolean): Promise<any>;
  genRequestedClaims(T108: _Lib.T109): Promise<any[]>;
  getClaimInfo(T110: _Lib.T111): Promise<any>;
  signature(T112: _Lib.T111): Promise<_Lib.T113>;
  prepareTx(T114: _Lib.T111): Promise<_Lib.T115>;
  tryWithTimeout(asyncFn: any): Promise<any>;
}
declare class BaseHandler extends events {
  authenticator: any;
  tokenStorage: any;
  pathTransformer(...args: any[]): any;
  onConnect(...args: any[]): any;
  /**
   * Creates an instance of DID Auth Handlers.
   *
   * @class
   * @param {object} config
   * @param {function} config.pathTransformer - function to transform path when generate action;
   * @param {object} config.tokenStorage - function to generate action token
   * @param {object} config.authenticator - Authenticator instance that can to jwt sign/verify
   * @param {function} [config.onConnect=noop] - function called when wallet selected did
   */
  constructor(T116: _Lib.T117);
}
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
declare class WalletHandlers extends BaseHandler {
  options: _Lib.T121;
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
  constructor(T118: _Lib.T120);
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
  attach(T122: _Lib.T123): void;
}
/**
 * Authenticator that can be used to sign did-auth payment on-behalf of another application
 * Can be used to build centralized platform services that aims to ease the life of developers
 *
 * @class AgentAuthenticator
 * @extends {WalletAuthenticator}
 */
declare class AgentAuthenticator extends WalletAuthenticator {
  /**
   * Sign a auth response that returned to wallet: tell the wallet the appInfo/chainInfo
   *
   * @method
   * @param {object} params
   * @param {string} params.context.token - action token
   * @param {string} params.context.userDid - decoded from req.query, base58
   * @param {string} params.context.userPk - decoded from req.query, base58
   * @param {object} params.context.didwallet - DID Wallet OS and version from user-agent
   * @param {string} params.context.sessionDid - did of logged-in user
   * @param {object} params.claims - info required by application to complete the auth
   * @param {object} params.appInfo - which application authorized me to sign
   * @param {object} params.authorizer - application pk and did
   * @param {object} params.verifiableClaims - what did the application authorized me to request from user
   * @param {object} params.extraParams - extra query params and locale
   * @returns {object} { appPk, authInfo }
   */
  sign(T124: any): any;
}
declare class AgentWalletHandlers extends WalletHandlers {
  agentStorage: any;
  /**
   * Creates an instance of DID Auth Handlers.
   *
   * @class
   * @param {object} config
   * @param {object} config.tokenStorage - did auth token storage
   * @param {object} config.agentStorage - agent auth storage
   * @param {object} config.authenticator - Authenticator instance that can to jwt sign/verify
   * @param {function} [config.onConnect=noop] - function called before each auth request send back to app, used to check for permission, throw error to halt the auth process
   * @param {object} [config.options={}] - custom options to define all handlers attached
   * @param {string} [config.options.prefix='/api/agent/:authorizeId'] - url prefix for this group endpoints
   * @param {string} [config.options.sessionDidKey='user.did'] - key path to extract session user did from request object
   * @param {string} [config.options.tokenKey='_t_'] - query param key for `token`
   */
  constructor(T125: _Lib.T127);
  /**
   * Attach routes and handlers for authenticator
   * Now express app have route handlers attached to the following url
   * - `GET /api/agent/:authorizeId/{action}/token` create new token
   * - `GET /api/agent/:authorizeId/{action}/status` check for token status
   * - `GET /api/agent/:authorizeId/{action}/timeout` expire a token
   * - `GET /api/agent/:authorizeId/{action}/auth` create auth response
   * - `POST /api/agent/:authorizeId/{action}/auth` process payment request
   *
   * @method
   * @param {object} config
   * @param {object} config.app - express instance to attach routes to
   * @param {object} config.claims - claims for this request
   * @param {string} config.action - action of this group of routes
   * @param {function} [config.onStart=noop] - callback when a new action start
   * @param {function} [config.onConnect=noop] - callback when user did selected
   * @param {function} config.onAuth - callback when user completed auth in DID Wallet, and data posted back
   * @param {function} [config.onDecline=noop] - callback when user has declined in wallet
   * @param {function} [config.onComplete=noop] - callback when the whole auth process is done, action token is removed
   * @param {function} [config.onExpire=noop] - callback when the action token expired
   * @param {function} [config.onError=console.error] - callback when there are some errors
   * @param {boolean|string|did} [config.authPrincipal=true] - whether should we do auth principal claim first
   * @return void
   */
  attach(T128: _Lib.T123): void;
}
declare const _Lib: _Lib.T129;
declare namespace _Lib {
  export interface T101 {
    wallet: any;
  }
  export interface T103 {
    token: string;
    baseUrl: string;
    pathname: string;
    query: any;
  }
  export interface T105 {
    response: any;
    errorMessage: string;
    successMessage: string;
    nextWorkflow: string;
  }
  export interface T107 {
    claims: any;
    pathname: any;
    challenge: any;
    extraParams: any;
  }
  export interface ChainInfo {
    id: string;
    host: string;
    restrictedDeclare: boolean;
  }
  export interface ApplicationInfo {
    name: string;
    description: string;
    icon: string;
    link: string;
    path: string;
    publisher: string;
  }
  export interface T109 {
    claims: any;
    context: any;
    extraParams: any;
  }
  export interface T111 {
    claim: any;
    context: any;
    extraParams: any;
  }
  export interface T113 {
    type: string;
    description: any;
    origin: string;
    typeUrl: any;
    display: any;
    method: any;
    digest: any;
    chainInfo: any;
    meta: any;
  }
  export interface T115 {
    type: string;
    description: string;
    partialTx: string;
    display: any;
    requirement: any;
    chainInfo: any;
    meta: any;
  }
  export interface T117 {
    pathTransformer: (...args: any[]) => any;
    tokenStorage: any;
    authenticator: any;
    onConnect?: (...args: any[]) => any;
  }
  export interface T119 {
    prefix?: string;
    cleanupDelay?: number;
    tokenKey?: string;
    encKey?: string;
  }
  export interface T120 {
    tokenStorage: any;
    authenticator: any;
    pathTransformer?: (...args: any[]) => any;
    onConnect?: (...args: any[]) => any;
    options?: _Lib.T119;
  }
  export interface T121 {
    prefix: string;
    cleanupDelay: number;
    tokenKey: string;
    encKey: string;
  }
  export interface T123 {
    app: any;
    claims: any;
    action: string;
    onStart?: (...args: any[]) => any;
    onConnect?: (...args: any[]) => any;
    onAuth: (...args: any[]) => any;
    onDecline?: (...args: any[]) => any;
    onComplete?: (...args: any[]) => any;
    onExpire?: (...args: any[]) => any;
    onError?: (...args: any[]) => any;
    authPrincipal?: any;
  }
  export interface T126 {
    prefix?: string;
    sessionDidKey?: string;
    tokenKey?: string;
  }
  export interface T127 {
    tokenStorage: any;
    agentStorage: any;
    authenticator: any;
    onConnect?: (...args: any[]) => any;
    options?: _Lib.T126;
  }
  export interface T129 {
    WalletAuthenticator: typeof WalletAuthenticator;
    WalletHandlers: typeof WalletHandlers;
    AgentAuthenticator: typeof AgentAuthenticator;
    AgentWalletHandlers: typeof AgentWalletHandlers;
  }
}
export = _Lib;
