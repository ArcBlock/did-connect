"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authenticator = void 0;
/* eslint-disable no-promise-executor-return */
const omit_1 = __importDefault(require("lodash/omit"));
const debug_1 = __importDefault(require("debug"));
const jwt_1 = require("@arcblock/jwt");
const util_1 = require("@ocap/util");
const did_1 = require("@arcblock/did");
const wallet_1 = require("@ocap/wallet");
const validator_1 = require("@did-connect/validator");
const debug = (0, debug_1.default)('@did-connect/authenticator');
const DEFAULT_TIMEOUT = 8000;
const DEFAULT_CHAIN_INFO = { host: 'none' };
class Authenticator {
    /**
     * Creates an instance of DID Authenticator.
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
        const { error } = validator_1.Context.validate(context);
        if (error) {
            throw new Error(`Invalid context: ${error.details.map((x) => x.message).join(', ')}`);
        }
        // eslint-disable-next-line no-param-reassign
        data = data || {};
        const final = { response: data.response ? data.response : data };
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
            final.response = (0, omit_1.default)(final.response, fields);
        }
        const { response = {}, errorMessage = '', successMessage = '', nextWorkflow = '' } = final;
        const { didwallet, session } = context;
        return {
            appPk: (0, util_1.toBase58)(this.wallet.publicKey),
            authInfo: (0, jwt_1.sign)(this.wallet.address, this.wallet.secretKey, {
                appInfo: session === null || session === void 0 ? void 0 : session.appInfo,
                status: errorMessage ? 'error' : 'ok',
                errorMessage: errorMessage || '',
                successMessage: successMessage || '',
                nextWorkflow: nextWorkflow || '',
                response,
            }, true, didwallet ? didwallet.jwt : undefined),
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
        const claimList = Array.isArray(claims) ? claims : [claims];
        let res = validator_1.RequestList.validate(claimList);
        if (res.error) {
            throw new Error(`Invalid claims: ${res.error.details.map((x) => x.message).join(', ')}`);
        }
        res = validator_1.Context.validate(context);
        if (res.error) {
            throw new Error(`Invalid context: ${res.error.details.map((x) => x.message).join(', ')}`);
        }
        const { sessionId, session, didwallet } = context;
        const { authUrl, challenge, appInfo } = session;
        const tmp = new URL(authUrl);
        tmp.searchParams.set('sid', sessionId);
        const nextUrl = tmp.href;
        // TODO: perhaps we should set chainInfo in each claim
        const claimWithChainInfo = claimList.find((x) => x.chainInfo);
        const payload = {
            action: 'responseAuth',
            challenge,
            appInfo,
            chainInfo: claimWithChainInfo ? claimWithChainInfo.chainInfo : DEFAULT_CHAIN_INFO,
            requestedClaims: claimList,
            url: nextUrl,
        };
        return {
            appPk: (0, util_1.toBase58)(this.wallet.publicKey),
            authInfo: (0, jwt_1.sign)(this.wallet.address, this.wallet.secretKey, payload, true, didwallet.jwt),
        };
    }
    /**
     * Determine appInfo on the fly
     */
    getAppInfo(context) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof this.appInfo === 'function') {
                // @ts-ignore
                const info = yield this.tryWithTimeout(() => this.appInfo(context));
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
        });
    }
    /**
     * Verify a DID connect response sent from DID Wallet
     */
    verify(data, locale = 'en', enforceTimestamp = true) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { iss, challenge = '', action = 'responseAuth', requestedClaims, } = yield this._verify(data, locale, enforceTimestamp);
                resolve({
                    userDid: (0, did_1.toAddress)(iss),
                    userPk: data.userPk,
                    claims: requestedClaims,
                    action,
                    challenge,
                });
                debug('verify.context', { userPk: data.userPk, userDid: (0, did_1.toAddress)(iss), action, challenge });
                debug('verify.claims', requestedClaims);
            }
            catch (err) {
                reject(err);
            }
        }));
    }
    _validateAppInfo(info) {
        if (typeof info === 'function') {
            return info;
        }
        if (!info) {
            throw new Error('Wallet authenticator can not work without appInfo');
        }
        const { value, error } = validator_1.AppInfo.validate(info);
        if (error) {
            throw new Error(`Wallet authenticator can not work with invalid appInfo: ${error.message}`);
        }
        return value;
    }
    _validateWallet(wallet) {
        if (!wallet) {
            throw new Error('Authenticator cannot work without wallet');
        }
        if ((0, wallet_1.isValid)(wallet)) {
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
    _verify(data, locale = 'en', enforceTimestamp = true) {
        return new Promise((resolve, reject) => {
            debug('verify', data, locale);
            const errors = {
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
            const pk = data.userPk;
            const info = data.userInfo;
            if (!pk) {
                return reject(new Error(errors.pkMissing[locale]));
            }
            if (!info) {
                return reject(new Error(errors.tokenMissing[locale]));
            }
            if (!pk) {
                return reject(new Error(errors.pkFormat[locale]));
            }
            if (!(0, jwt_1.verify)(info, pk)) {
                // NOTE: since the token can be invalid because of wallet-app clock not in sync
                // We should tell the user that if it's caused by clock
                const isValidSig = (0, jwt_1.verify)(info, pk, { tolerance: 0, enforceTimestamp: false });
                if (enforceTimestamp) {
                    const error = isValidSig ? errors.timeInvalid[locale] : errors.tokenInvalid[locale];
                    return reject(new Error(error));
                }
            }
            return resolve((0, jwt_1.decode)(info));
        });
    }
    tryWithTimeout(asyncFn) {
        if (typeof asyncFn !== 'function') {
            throw new Error('asyncFn must be a valid function');
        }
        const timeout = Number(this.timeout) || DEFAULT_TIMEOUT;
        // eslint-disable-next-line no-async-promise-executor
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const timer = setTimeout(() => {
                reject(new Error(`Async operation did not complete within ${timeout} ms`));
            }, timeout);
            try {
                const result = yield asyncFn();
                resolve(result);
            }
            catch (err) {
                reject(err);
            }
            finally {
                clearTimeout(timer);
            }
        }));
    }
}
exports.Authenticator = Authenticator;
