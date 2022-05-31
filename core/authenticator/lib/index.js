/* eslint-disable no-promise-executor-return */
const omit = require('lodash/omit');
const Jwt = require('@arcblock/jwt');
const { toBase58 } = require('@ocap/util');
const { toAddress } = require('@arcblock/did');
const { isValid } = require('@ocap/wallet');
const { Joi, appInfo: appInfoSchema, context: contextSchema, claims: claimsSchema } = require('@did-connect/validator');

// eslint-disable-next-line
const debug = require('debug')(`${require('../package.json').name}`);

const DEFAULT_TIMEOUT = 8000;
const DEFAULT_CHAIN_INFO = { host: 'none' };

const claimsValidator = Joi.array()
  .items(...Object.values(claimsSchema))
  .min(1);

class Authenticator {
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
  constructor({ wallet, appInfo, chainInfo = DEFAULT_CHAIN_INFO, timeout = DEFAULT_TIMEOUT }) {
    this.wallet = this._validateWallet(wallet);
    this.appInfo = this._validateAppInfo(appInfo);
    this.chainInfo = chainInfo;
    this.timeout = timeout;
  }

  /**
   * Sign a plain response, usually on auth success or error
   *
   * @method
   * @param {object} data
   * @param {object} data.response - response
   * @param {string} data.errorMessage - error message, default to empty
   * @param {string} data.successMessage - success message, default to empty
   * @param {string} data.nextWorkflow - https://github.com/ArcBlock/ABT-DID-Protocol#concatenate-multiple-workflow
   * @param {object} context
   * @returns {object} { appPk, authInfo }
   */
  signJson(data, context) {
    const { error } = contextSchema.validate(context);
    if (error) {
      throw new Error(`Invalid context: ${error.details.map((x) => x.message).join(', ')}`);
    }

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
      appPk: toBase58(this.wallet.publicKey),
      authInfo: Jwt.sign(
        this.wallet.address,
        this.wallet.secretKey,
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
   * @param {object} claims - info required by application to complete the auth
   * @param {object} context - context
   * @returns {object} { appPk, authInfo }
   */
  signClaims(claims, context) {
    let res = claimsValidator.validate(claims);
    if (res.error) {
      throw new Error(`Invalid claims: ${res.error.details.map((x) => x.message).join(', ')}`);
    }

    res = contextSchema.validate(context);
    if (res.error) {
      throw new Error(`Invalid context: ${res.error.details.map((x) => x.message).join(', ')}`);
    }

    const { sessionId, session, didwallet } = context;
    const { authUrl, challenge, appInfo } = session;

    const tmp = new URL(authUrl);
    tmp.searchParams.set('sid', sessionId);
    const nextUrl = tmp.href;

    const payload = {
      action: 'responseAuth',
      challenge,
      appInfo,
      chainInfo: DEFAULT_CHAIN_INFO, // FIXME: get chainInfo from claim
      requestedClaims: claims,
      url: nextUrl,
    };

    return {
      appPk: toBase58(this.wallet.publicKey),
      authInfo: Jwt.sign(this.wallet.address, this.wallet.secretKey, payload, true, didwallet.jwt),
      signed: true,
    };
  }

  /**
   * Determine appInfo on the fly
   *
   * @param {object} params - contains the context of this request
   * @param {object|undefined} info - app info object or function
   * @returns {ApplicationInfo}
   * @memberof Authenticator
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

  /**
   * Verify a DID connect response sent from DID Wallet
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
      throw new Error('Wallet authenticator can not work without appInfo');
    }

    const { value, error } = appInfoSchema.validate(info);
    if (error) {
      throw new Error(`Wallet authenticator can not work with invalid appInfo: ${error.message}`);
    }
    return value;
  }

  _isValidChainInfo(x) {
    return x && x.host;
  }

  _validateWallet(wallet) {
    if (!wallet) {
      throw new Error('Authenticator cannot work without wallet');
    }

    if (isValid(wallet)) {
      return wallet;
    }

    throw new Error('Authenticator cannot work without valid wallet');
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
  _verify(data, fieldPk, fieldInfo, locale = 'en', enforceTimestamp = true) {
    return new Promise((resolve, reject) => {
      debug('verify', data, locale);

      const errors = {
        pkMissing: {
          en: `${fieldPk} is required to complete auth`,
          zh: `${fieldPk} 参数缺失`,
        },
        tokenMissing: {
          en: `${fieldInfo} is required to complete auth`,
          zh: 'JWT Token 参数缺失',
        },
        pkFormat: {
          en: `${fieldPk} should be either base58 or base16 format`,
          zh: `${fieldPk} 无法解析`,
        },
        tokenInvalid: {
          en: 'Invalid JWT token',
          zh: '签名无效',
        },
        timeInvalid: {
          en: 'JWT token expired, make sure your device time in sync with network',
          zh: '签名中的时间戳无效，请确保设备和网络时间同步',
        },
      };

      const pk = data[fieldPk];
      const info = data[fieldInfo];
      if (!pk) {
        return reject(new Error(errors.pkMissing[locale]));
      }
      if (!info) {
        return reject(new Error(errors.tokenMissing[locale]));
      }

      if (!pk) {
        return reject(new Error(errors.pkFormat[locale]));
      }

      if (!Jwt.verify(info, pk)) {
        // NOTE: since the token can be invalid because of wallet-app clock not in sync
        // We should tell the user that if it's caused by clock
        const isValidSig = Jwt.verify(info, pk, { tolerance: 0, enforceTimestamp: false });
        if (enforceTimestamp) {
          const error = isValidSig ? errors.timeInvalid[locale] : errors.tokenInvalid[locale];
          return reject(new Error(error));
        }
      }

      return resolve(Jwt.decode(info));
    });
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

module.exports = Authenticator;
