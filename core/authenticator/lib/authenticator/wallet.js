/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
/* eslint-disable object-curly-newline */
const qs = require('querystring');
const pick = require('lodash/pick');
const isEqual = require('lodash/isEqual');
const Client = require('@ocap/client');
const Jwt = require('@arcblock/jwt');
const { toBase58 } = require('@ocap/util');
const { fromAddress } = require('@ocap/wallet');
const { toAddress } = require('@arcblock/did');

const BaseAuthenticator = require('./base');

// eslint-disable-next-line
const debug = require('debug')(`${require('../../package.json').name}:authenticator:wallet`);

const { DEFAULT_CHAIN_INFO } = BaseAuthenticator;
const DEFAULT_TIMEOUT = 8000;

const schema = require('../schema');

const formatDisplay = (display) => {
  // empty
  if (!display) {
    return '';
  }

  // object like
  if (display && display.type && display.content) {
    return JSON.stringify(pick(display, ['type', 'content']));
  }

  // string like
  try {
    const parsed = JSON.parse(display);
    if (parsed && parsed.type && parsed.content) {
      return display;
    }
    return '';
  } catch (err) {
    return '';
  }
};

class WalletAuthenticator extends BaseAuthenticator {
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
  constructor({
    wallet,
    appInfo,
    timeout = DEFAULT_TIMEOUT,
    chainInfo = DEFAULT_CHAIN_INFO,
    baseUrl = '',
    tokenKey = '_t_',
  }) {
    super();

    this.wallet = this._validateWallet(wallet);
    this.appInfo = this._validateAppInfo(appInfo);
    this.chainInfo = chainInfo;

    this.baseUrl = baseUrl;
    this.tokenKey = tokenKey;
    this.timeout = timeout;

    if (!this.appInfo.link) {
      this.appInfo.link = this.baseUrl;
    }
  }

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
  async uri({ baseUrl, pathname = '', token = '', query = {} } = {}) {
    const params = { ...query, [this.tokenKey]: token };
    const payload = {
      action: 'requestAuth',
      url: encodeURIComponent(`${this.baseUrl || baseUrl}${pathname}?${qs.stringify(params)}`),
    };

    const uri = `https://abtwallet.io/i/?${qs.stringify(payload)}`;
    debug('uri', { token, pathname, uri, params, payload });
    return uri;
  }

  /**
   * Compute public url to return to wallet
   *
   * @method
   * @param {string} pathname
   * @param {object} params
   * @returns {string}
   */
  getPublicUrl(pathname, params = {}, baseUrl = '') {
    return `${this.baseUrl || baseUrl}${pathname}?${qs.stringify(params)}`;
  }

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
  async signResponse({ response = {}, errorMessage = '', successMessage = '', nextWorkflow = '' }, baseUrl, request) {
    const wallet = await this.getWalletInfo({ baseUrl, request });
    const appInfo = await this.getAppInfo({ baseUrl, request, wallet });
    const didwallet = request.context.wallet;

    const payload = {
      appInfo,
      status: errorMessage ? 'error' : 'ok',
      errorMessage: errorMessage || '',
      successMessage: successMessage || '',
      nextWorkflow: nextWorkflow || '',
      response,
    };

    return {
      appPk: toBase58(wallet.pk),
      authInfo: Jwt.sign(wallet.address, wallet.sk, payload, true, didwallet ? didwallet.jwt : undefined),
    };
  }

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
  async sign({ context, request, claims, pathname = '', baseUrl = '', challenge = '', extraParams = {} }) {
    // debug('sign.context', context);
    // debug('sign.params', extraParams);

    const claimsInfo = await this.tryWithTimeout(() =>
      this.genRequestedClaims({
        claims,
        context: { baseUrl, request, ...context },
        extraParams,
      })
    );

    // FIXME: this maybe buggy if user provided multiple claims
    const tmp = claimsInfo.find((x) => isEqual(this._isValidChainInfo(x.chainInfo), DEFAULT_CHAIN_INFO) === false);

    const infoParams = { baseUrl, request, ...context, ...extraParams };
    const wallet = await this.getWalletInfo(infoParams);
    const appInfo = await this.getAppInfo({ ...infoParams, wallet });
    const chainInfo = await this.getChainInfo(infoParams, tmp ? tmp.chainInfo : DEFAULT_CHAIN_INFO);

    const payload = {
      action: 'responseAuth',
      challenge,
      appInfo,
      chainInfo,
      requestedClaims: claimsInfo.map((x) => {
        delete x.chainInfo;
        return x;
      }),
      url: `${this.baseUrl || baseUrl}${pathname}?${qs.stringify({ [this.tokenKey]: context.token })}`,
    };

    // debug('sign.payload', payload);

    const version = context.didwallet ? context.didwallet.jwt : undefined;
    return {
      appPk: toBase58(wallet.pk),
      authInfo: Jwt.sign(wallet.address, wallet.sk, payload, true, version),
    };
  }

  /**
   * Determine chainInfo on the fly
   *
   * @param {object} params - contains the context of this request
   * @param {object|undefined} info - chain info object or function
   * @returns {ChainInfo}
   * @memberof WalletAuthenticator
   */
  async getChainInfo(params, info) {
    if (info) {
      return this._isValidChainInfo(info) ? info : DEFAULT_CHAIN_INFO;
    }

    if (typeof this.chainInfo === 'function') {
      const result = await this.tryWithTimeout(() => this.chainInfo(params));
      return this._isValidChainInfo(result) ? result : DEFAULT_CHAIN_INFO;
    }

    return this.chainInfo || DEFAULT_CHAIN_INFO;
  }

  /**
   * Determine appInfo on the fly
   *
   * @param {object} params - contains the context of this request
   * @param {object|undefined} info - app info object or function
   * @returns {ApplicationInfo}
   * @memberof WalletAuthenticator
   */
  async getAppInfo(params) {
    if (typeof this.appInfo === 'function') {
      const info = await this.tryWithTimeout(() => this.appInfo(params));
      if (!info.link) {
        info.link = params.baseUrl;
      }
      if (!info.publisher) {
        info.publisher = `did:abt:${params.wallet.address}`;
      }

      return this._validateAppInfo(info);
    }

    if (this.appInfo && !this.appInfo.publisher) {
      this.appInfo.publisher = `did:abt:${params.wallet.address}`;
    }

    return this.appInfo;
  }

  async getWalletInfo(params) {
    if (typeof this.wallet === 'function') {
      const result = await this.tryWithTimeout(() => this.wallet(params));
      if (this._validateWallet(result)) {
        return result;
      }

      throw new Error('Invalid wallet function provided');
    }

    return this.wallet;
  }

  /**
   * Verify a DID auth response sent from DID Wallet
   *
   * @method
   * @param {object} data
   * @param {string} [locale=en]
   * @param {boolean} [enforceTimestamp=true]
   * @returns Promise<boolean>
   */
  verify(data, locale = 'en', enforceTimestamp = true) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const {
          iss,
          challenge = '',
          action = 'responseAuth',
          requestedClaims,
        } = await this._verify(data, 'userPk', 'userInfo', locale, enforceTimestamp);

        resolve({
          token: data.token,
          userDid: toAddress(iss),
          userPk: data.userPk,
          claims: requestedClaims,
          action,
          challenge,
        });

        debug('verify.context', { userPk: data.userPk, userDid: toAddress(iss), action, challenge });
        debug('verify.claims', requestedClaims);
      } catch (err) {
        reject(err);
      }
    });
  }

  // ---------------------------------------
  // Request claim related methods
  // ---------------------------------------
  genRequestedClaims({ claims, context, extraParams }) {
    return Promise.all(
      Object.keys(claims).map(async (x) => {
        let name = x;
        let claim = claims[x];

        if (Array.isArray(claims[x])) {
          [name, claim] = claims[x];
        }

        if (!schema.claims[name]) {
          throw new Error(`Unsupported claim type ${name}`);
        }

        const fn = typeof this[name] === 'function' ? name : 'getClaimInfo';
        const result = await this[fn]({ claim, context, extraParams });
        const { value, error } = schema.claims[name].validate(result);
        if (error) {
          throw new Error(`Invalid ${name} claim: ${error.message}`);
        }

        return value;
      })
    );
  }

  async getClaimInfo({ claim, context, extraParams }) {
    const { userDid, userPk, didwallet } = context;
    const result =
      typeof claim === 'function'
        ? await claim({
            userDid: userDid ? toAddress(userDid) : '',
            userPk: userPk || '',
            didwallet,
            extraParams,
            context,
          })
        : claim;

    const infoParams = { ...context, ...extraParams };
    const chainInfo = await this.getChainInfo(infoParams, result.chainInfo);

    result.chainInfo = chainInfo;

    return result;
  }

  // Request wallet to sign something: transaction/text/html/image
  async signature({ claim, context, extraParams }) {
    const {
      data,
      type = 'mime:text/plain',
      digest = '',
      method = 'sha3', // set this to `none` to instruct wallet not to hash before signing
      wallet,
      sender,
      display,
      description: desc,
      chainInfo,
      meta = {},
    } = await this.getClaimInfo({
      claim,
      context,
      extraParams,
    });

    debug('claim.signature', { data, digest, type, sender, context });

    if (!data && !digest) {
      throw new Error('Signature claim requires either data or digest to be provided');
    }

    const description = desc || 'Sign this transaction to continue.';

    // We have to encode the transaction
    if (type.endsWith('Tx')) {
      if (!chainInfo.host) {
        throw new Error('Invalid chainInfo when trying to encoding transaction');
      }

      const client = new Client(chainInfo.host);

      if (typeof client[`encode${type}`] !== 'function') {
        throw new Error(`Unsupported transaction type ${type}`);
      }

      if (!data.pk) {
        data.pk = context.userPk;
      }

      try {
        const { buffer: txBuffer } = await client[`encode${type}`]({
          tx: data,
          wallet: wallet || fromAddress(sender || context.userDid),
        });

        return {
          type: 'signature',
          description,
          typeUrl: 'fg:t:transaction',
          origin: toBase58(txBuffer),
          method,
          display: formatDisplay(display),
          digest: '',
          chainInfo,
          meta,
        };
      } catch (err) {
        throw new Error(`Failed to encode transaction: ${err.message}`);
      }
    }

    // We have en encoded transaction
    if (type === 'fg:t:transaction') {
      return {
        type: 'signature',
        description,
        typeUrl: 'fg:t:transaction',
        origin: toBase58(data),
        display: formatDisplay(display),
        method,
        digest: '',
        chainInfo,
        meta,
      };
    }

    // If we are ask user to sign anything just pass the data
    // Wallet should not hash the data if `method` is empty
    // If we are asking user to sign a very large piece of data
    // Just hash the data and show him the digest
    return {
      type: 'signature',
      description: desc || 'Sign this message to continue.',
      origin: data ? toBase58(data) : '',
      typeUrl: type,
      display: formatDisplay(display),
      method,
      digest,
      chainInfo,
      meta,
    };
  }

  // Request wallet to complete and sign a partial tx to broadcasting
  // Usually used in payment scenarios
  // The wallet can leverage multiple input capabilities of the chain
  async prepareTx({ claim, context, extraParams }) {
    const {
      partialTx,
      requirement,
      type,
      display,
      wallet,
      sender,
      description: desc,
      chainInfo,
      meta = {},
    } = await this.getClaimInfo({
      claim,
      context,
      extraParams,
    });

    debug('claim.prepareTx', { partialTx, requirement, type, sender, context });

    if (!partialTx || !requirement) {
      throw new Error('prepareTx claim requires both partialTx and requirement to be provided');
    }

    const description = desc || 'Prepare and sign this transaction to continue.';
    const defaultRequirement = { tokens: [], assets: {} };

    // We have to encode the transaction
    if (type && type.endsWith('Tx')) {
      if (!chainInfo.host) {
        throw new Error('Invalid chainInfo when trying to encoding partial transaction');
      }

      const client = new Client(chainInfo.host);

      if (typeof client[`encode${type}`] !== 'function') {
        throw new Error(`Unsupported transaction type ${type} when encoding partial transaction`);
      }

      if (!partialTx.pk) {
        partialTx.pk = context.userPk;
      }

      try {
        const { buffer: txBuffer } = await client[`encode${type}`]({
          tx: partialTx,
          wallet: wallet || fromAddress(sender || context.userDid),
        });

        return {
          type: 'prepareTx',
          description,
          partialTx: toBase58(txBuffer),
          display: formatDisplay(display),
          requirement: Object.assign(defaultRequirement, requirement),
          chainInfo,
          meta,
        };
      } catch (err) {
        throw new Error(`Failed to encode partial transaction: ${err.message}`);
      }
    }

    // We have en encoded transaction
    return {
      type: 'prepareTx',
      description,
      partialTx: toBase58(partialTx),
      requirement: Object.assign(defaultRequirement, requirement),
      display: formatDisplay(display),
      chainInfo,
      meta,
    };
  }

  _validateAppInfo(info) {
    if (typeof info === 'function') {
      return info;
    }

    if (!info) {
      throw new Error('Wallet authenticator can not work with invalid appInfo: empty');
    }

    const { value, error } = schema.appInfo.validate(info);
    if (error) {
      throw new Error(`Wallet authenticator can not work with invalid appInfo: ${error.message}`);
    }
    return value;
  }

  _isValidChainInfo(x) {
    return x && x.host;
  }

  tryWithTimeout(asyncFn) {
    if (typeof asyncFn !== 'function') {
      throw new Error('asyncFn must be a valid function');
    }

    const timeout = Number(this.timeout) || DEFAULT_TIMEOUT;

    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Async operation did not complete within ${timeout} ms`));
      }, timeout);

      try {
        const result = await asyncFn();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        clearTimeout(timer);
      }
    });
  }
}

module.exports = WalletAuthenticator;
module.exports.formatDisplay = formatDisplay;
