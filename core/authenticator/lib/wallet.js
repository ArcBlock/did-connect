const pick = require('lodash/pick');
const omit = require('lodash/omit');
const Jwt = require('@arcblock/jwt');
const { toBase58 } = require('@ocap/util');
const { toAddress } = require('@arcblock/did');
const schema = require('@did-connect/validator');

const BaseAuthenticator = require('./base');

// eslint-disable-next-line
const debug = require('debug')(`${require('../package.json').name}:authenticator:wallet`);

const { DEFAULT_CHAIN_INFO } = BaseAuthenticator;
const DEFAULT_TIMEOUT = 8000;

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
   * @example
   * const { fromRandom } = require('@ocap/wallet');
   *
   * const wallet = fromRandom().toJSON();
   * const chainHost = 'https://beta.abtnetwork.io/api';
   * const chainId = 'beta';
   * const auth = new Authenticator({
   *   wallet,
   *   appInfo: {
   *     name: 'DID Wallet Demo',
   *     description: 'Demo application to show the potential of DID Wallet',
   *     icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
   *     link: 'http://beta.abtnetwork.io/webapp',
   *   },
   *   chainInfo: {
   *     host: chainHost,
   *     id: chainId,
   *   },
   *   timeout: 8000,
   * });
   */
  constructor({ wallet, appInfo, timeout = DEFAULT_TIMEOUT, chainInfo = DEFAULT_CHAIN_INFO }) {
    super();

    this.wallet = this._validateWallet(wallet);
    this.appInfo = this._validateAppInfo(appInfo);
    this.chainInfo = chainInfo;

    this.timeout = timeout;
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
   * @param {object} request
   * @returns {object} { appPk, authInfo }
   */
  signJson(data, context) {
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
  signClaims(claims, context) {
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
