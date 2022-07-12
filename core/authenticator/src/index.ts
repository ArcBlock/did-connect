/* eslint-disable no-promise-executor-return */
import omit from 'lodash/omit';
import Debug from 'debug';
import { sign, verify, decode, JwtBody } from '@arcblock/jwt';
import { toBase58 } from '@ocap/util';
import { toAddress } from '@arcblock/did';
import { isValid, WalletObject } from '@ocap/wallet';
import { AppInfo } from '@did-connect/types';
import type {
  TLocaleCode,
  TAppInfo,
  TAppResponse,
  TAuthResponse,
  TChainInfo,
  TSession,
  TContext,
  TAnyRequest,
  TAnyResponse,
  TI18nMessages,
} from '@did-connect/types';

type AuthenticatorOptions = {
  wallet: WalletObject;
  appInfo: TAppInfo | Function;
  chainInfo?: TChainInfo;
  timeout?: number;
};

export type TAppResponseSigned = {
  appPk: string;
  authInfo: string;
};

export type WalletResponse = {
  userDid: string;
  userPk: string;
  claims: TAnyResponse[];
  action: string;
  challenge: string;
};

export type TWalletResponseSigned = {
  userPk: string;
  userInfo: string;
};

const debug = Debug('@did-connect/authenticator');

const DEFAULT_TIMEOUT = 8000;
const DEFAULT_CHAIN_INFO: TChainInfo = { host: 'none' };

const errors: TI18nMessages = {
  pkMissing: {
    en: 'userPk is required to complete auth',
    zh: 'userPk 参数缺失',
  },
  tokenMissing: {
    en: 'userInfo is required to complete auth',
    zh: 'JWT Token 参数缺失',
  },
  pkFormat: {
    en: 'userPk should be either base58 or base16 format',
    zh: 'userPk 无法解析',
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

export class Authenticator {
  readonly wallet: WalletObject;

  readonly appInfo: TAppInfo | Function;

  readonly chainInfo: TChainInfo;

  readonly timeout: number;

  /**
   * Creates an instance of DID Authenticator.
   */
  constructor({ wallet, appInfo, chainInfo = DEFAULT_CHAIN_INFO, timeout = DEFAULT_TIMEOUT }: AuthenticatorOptions) {
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
  signJson(data: TAppResponse, context: TContext): TAppResponseSigned {
    const final: TAppResponse = { response: data.response ? data.response : data };

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
    if (typeof final.response === 'object') {
      final.response = omit(final.response, fields);
    }

    const { response = {}, errorMessage = '', successMessage = '', nextWorkflow = '' } = final;
    const { didwallet, session } = context;

    const payload: Partial<TAuthResponse> = {
      appInfo: (session as TSession).appInfo,
      status: errorMessage ? 'error' : 'ok',
      errorMessage: errorMessage || '',
      successMessage: successMessage || '',
      nextWorkflow: nextWorkflow || '',
      response,
    };

    return {
      appPk: toBase58(this.wallet.publicKey),
      authInfo: sign(
        this.wallet.address,
        this.wallet.secretKey as string,
        payload,
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
  signClaims(claims: TAnyRequest[], context: TContext): TAppResponseSigned {
    const { sessionId, session, didwallet } = context;
    const { authUrl, challenge, appInfo } = session as TSession;

    const tmp = new URL(authUrl);
    tmp.searchParams.set('sid', sessionId);
    const nextUrl = tmp.href;

    // TODO: perhaps we should set and respect chainInfo in each claim
    const claimWithChainInfo = claims.find((x: TAnyRequest) => x.chainInfo);

    const payload: Partial<TAuthResponse> = {
      action: 'responseAuth',
      challenge,
      appInfo,
      chainInfo: claimWithChainInfo ? claimWithChainInfo.chainInfo : DEFAULT_CHAIN_INFO,
      requestedClaims: claims,
      url: nextUrl,
    };

    return {
      appPk: toBase58(this.wallet.publicKey),
      authInfo: sign(this.wallet.address, this.wallet.secretKey as string, payload, true, didwallet.jwt),
    };
  }

  /**
   * Determine appInfo on the fly
   */
  async getAppInfo(context: TContext & { baseUrl: string }): Promise<TAppInfo> {
    if (typeof this.appInfo === 'function') {
      // @ts-ignore
      const info: TAppInfo = await this.tryWithTimeout(() => this.appInfo(context));
      if (!info.publisher) {
        info.publisher = `did:abt:${this.wallet.address}`;
      }

      // @ts-ignore
      return this._validateAppInfo(info);
    }

    if (this.appInfo && !this.appInfo.publisher) {
      this.appInfo.publisher = `did:abt:${this.wallet.address}`;
    }

    return this.appInfo;
  }

  /**
   * Verify a DID connect response sent from DID Wallet
   */
  verify(
    data: TWalletResponseSigned,
    locale: TLocaleCode = 'en',
    enforceTimestamp: boolean = true
  ): Promise<WalletResponse> {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const {
          iss,
          challenge = '',
          action = 'responseAuth',
          requestedClaims,
        } = await this._verify(data, locale, enforceTimestamp);

        const userDid = toAddress(iss as string);

        resolve({
          userDid,
          userPk: data.userPk,
          claims: requestedClaims,
          action,
          challenge,
        });

        debug('verify.context', { userPk: data.userPk, userDid, action, challenge });
        debug('verify.claims', requestedClaims);
      } catch (err) {
        reject(err);
      }
    });
  }

  _validateAppInfo(info: TAppInfo | Function): TAppInfo | Function {
    if (typeof info === 'function') {
      return info;
    }

    if (!info) {
      throw new Error('Wallet authenticator can not work without appInfo');
    }

    const { value, error } = AppInfo.validate(info);
    if (error) {
      throw new Error(`Wallet authenticator can not work with invalid appInfo: ${error.message}`);
    }
    return value;
  }

  _validateWallet(wallet: WalletObject) {
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
  _verify(data: TWalletResponseSigned, locale: TLocaleCode = 'en', enforceTimestamp: boolean = true): Promise<JwtBody> {
    return new Promise((resolve, reject) => {
      debug('verify', data, locale);

      const pk = data.userPk;
      const info = data.userInfo;
      if (!pk) {
        return reject(new Error(errors.pkMissing[locale]));
      }
      if (!info) {
        return reject(new Error(errors.tokenMissing[locale]));
      }

      if (!verify(info, pk)) {
        // NOTE: since the token can be invalid because of wallet-app clock not in sync
        // We should tell the user that if it's caused by clock
        const isValidSig = verify(info, pk, { tolerance: 0, enforceTimestamp: false });
        if (enforceTimestamp) {
          const error = isValidSig ? errors.timeInvalid[locale] : errors.tokenInvalid[locale];
          return reject(new Error(error));
        }
      }

      return resolve(decode(info) as JwtBody);
    });
  }

  tryWithTimeout(asyncFn: Function): Promise<TAppInfo> {
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
