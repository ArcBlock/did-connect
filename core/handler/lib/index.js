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
exports.createHandlers = exports.createSocketServer = exports.CustomError = void 0;
const pick_1 = __importDefault(require("lodash/pick"));
const isEmpty_1 = __importDefault(require("lodash/isEmpty"));
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const p_wait_for_1 = __importDefault(require("p-wait-for"));
const jwt_1 = require("@arcblock/jwt");
const object_hash_1 = __importDefault(require("object-hash"));
const ws_1 = require("@arcblock/ws");
const did_1 = require("@arcblock/did");
const types_1 = require("@did-connect/types");
// eslint-disable-next-line
// const debug = require('debug')(`${require('../package.json').name}`);
const { getStepChallenge, parseWalletUA } = require('./util');
const errors = {
    sessionNotFound: {
        en: 'Session not found or expired',
        zh: '会话不存在或已过期',
    },
    didMismatch: {
        en: 'Login user and wallet user mismatch, please reconnect and try again',
        zh: '登录用户和扫码用户不匹配，为保障安全，请重新登录应用',
    },
    challengeMismatch: {
        en: 'Challenge mismatch',
        zh: '随机校验码不匹配',
    },
    userDeclined: {
        en: 'You have declined the authentication request',
        zh: '授权请求被拒绝',
    },
    userCanceled: {
        en: 'User has canceled the request from app',
        zh: '用户在应用端取消了请求',
    },
    claimMismatch: {
        en: 'Claims provided by wallet do not match with requested claims',
        zh: '提交的声明类型和请求的声明类型不匹配',
    },
};
class CustomError extends Error {
    constructor(code, message) {
        super(message);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
        this.code = code;
    }
}
exports.CustomError = CustomError;
function createSocketServer(logger, pathname) {
    return new ws_1.WsServer({ logger, pathname });
}
exports.createSocketServer = createSocketServer;
// FIXME: i18n for errors
function createHandlers({ storage, // FIXME:
authenticator, // FIXME:
logger = console, socketPathname = '/api/connect/relay/websocket', }) {
    const wsServer = createSocketServer(logger, socketPathname);
    const isValidContext = (x) => {
        const { error } = types_1.Context.validate(x);
        // if (error) logger.error(error);
        return !error;
    };
    const signJson = authenticator.signJson.bind(authenticator);
    const signClaims = authenticator.signClaims.bind(authenticator);
    const verifyUpdater = (params, updaterPk) => {
        const { body, signerPk, signerToken } = params;
        if (!signerPk) {
            return { error: 'Invalid updater pk', code: 'UPDATER_PK_EMPTY' };
        }
        if (!signerToken) {
            return { error: 'Invalid token', code: 'SIGNATURE_EMPTY' };
        }
        if ((0, jwt_1.verify)(signerToken, signerPk) === false) {
            return { error: 'Invalid updater signature', code: 'SIGNATURE_INVALID' };
        }
        if (updaterPk && updaterPk !== signerPk) {
            return { error: 'Invalid updater', code: 'UPDATER_MISMATCH' };
        }
        const hash = (0, object_hash_1.default)(body);
        const decoded = (0, jwt_1.decode)(signerToken);
        if (decoded.hash !== hash) {
            return { error: 'Invalid payload hash', code: 'PAYLOAD_HASH_MISMATCH' };
        }
        return { error: '', code: 'OK' };
    };
    const handleSessionCreate = (context) => __awaiter(this, void 0, void 0, function* () {
        if (isValidContext(context) === false) {
            return { error: 'Invalid context', code: 'CONTEXT_INVALID' };
        }
        const { sessionId, updaterPk, strategy = 'default', authUrl, autoConnect, onlyConnect, requestedClaims = [], timeout, } = context.body;
        if (sessionId.length !== 21) {
            return { error: 'Invalid sessionId', code: 'SESSION_ID_INVALID' };
        }
        const result = verifyUpdater(context);
        if (result.error) {
            return result;
        }
        const session = {
            status: 'created',
            updaterPk,
            strategy,
            authUrl,
            challenge: getStepChallenge(),
            autoConnect,
            onlyConnect,
            // FIXME: app link should be updated according to blocklet env?
            appInfo: yield authenticator.getAppInfo(Object.assign(Object.assign({}, context), { baseUrl: new URL(authUrl).origin })),
            previousConnected: context.previousConnected,
            currentConnected: null,
            currentStep: 0,
            requestedClaims,
            responseClaims: [],
            approveResults: [],
            timeout,
            error: '',
        };
        const { value, error } = types_1.Session.validate(session);
        if (error) {
            return {
                error: `Invalid session updates: ${error.details.map((x) => x.message).join(', ')}`,
                code: 'SESSION_UPDATE_INVALID',
            };
        }
        logger.debug('session.created', sessionId);
        return storage.create(sessionId, value);
    });
    const handleSessionRead = (sessionId) => __awaiter(this, void 0, void 0, function* () {
        return storage.read(sessionId);
    });
    const handleSessionUpdate = (context) => __awaiter(this, void 0, void 0, function* () {
        const { body, session, sessionId } = context;
        try {
            if (isValidContext(context) === false) {
                throw new CustomError('CONTEXT_INVALID', 'Invalid context');
            }
            if (storage.isFinalized(session.status)) {
                throw new CustomError('SESSION_FINALIZED', `Session finalized as ${session.status}${session.error ? `: ${session.error}` : ''}`);
            }
            const result = verifyUpdater(context, session.updaterPk);
            if (result.error) {
                throw new CustomError(result.code, result.error);
            }
            if (body.status && ['error', 'canceled'].includes(body.status) === false) {
                throw new CustomError('SESSION_STATUS_INVALID', 'Can only update session status to error or canceled');
            }
            const { error, value } = types_1.Session.validate(Object.assign(Object.assign({}, session), body));
            if (error) {
                throw new CustomError('SESSION_UPDATE_INVALID', `Invalid session updates: ${error.details.map((x) => x.message).join(', ')}`);
            }
            const updates = (0, pick_1.default)(value, ['error', 'status', 'approveResults', 'requestedClaims']);
            logger.info('update session', context.sessionId, updates);
            return storage.update(context.sessionId, updates);
        }
        catch (err) {
            logger.error(err);
            wsServer.broadcast(sessionId, { status: 'error', error: err.message });
            yield storage.update(sessionId, { status: 'error', error: err.message });
            return { error: err.message, code: err.code };
        }
    });
    const handleClaimRequest = (context) => __awaiter(this, void 0, void 0, function* () {
        const { sessionId, session, didwallet } = context;
        try {
            if (isValidContext(context) === false) {
                throw new CustomError('CONTEXT_INVALID', 'Invalid context');
            }
            const { strategy, previousConnected, onlyConnect, currentStep } = session;
            if (storage.isFinalized(session.status)) {
                throw new CustomError('SESSION_FINALIZED', `Session finalized as ${session.status}${session.error ? `: ${session.error}` : ''}`);
            }
            // if we are in created status, we should return authPrincipal claim
            if (session.status === 'created') {
                logger.debug('session.walletScanned', sessionId);
                wsServer.broadcast(sessionId, { status: 'walletScanned', didwallet });
                yield storage.update(sessionId, { status: 'walletScanned' });
                return signClaims([
                    {
                        type: 'authPrincipal',
                        description: 'select the principal to be used for authentication',
                        target: (0, did_1.isValid)(strategy) ? strategy : '',
                        supervised: onlyConnect || !!previousConnected,
                    },
                ], context);
            }
            // else we should perform a step by step style
            return signClaims(session.requestedClaims[currentStep], context);
        }
        catch (err) {
            logger.error(err);
            wsServer.broadcast(sessionId, { status: 'error', error: err.message });
            yield storage.update(sessionId, { status: 'error', error: err.message });
            return signJson({ error: err.message }, context);
        }
    });
    const waitForSession = (sessionId, timeout, checkFn, reason, locale) => __awaiter(this, void 0, void 0, function* () {
        let session = {};
        try {
            yield (0, p_wait_for_1.default)(() => __awaiter(this, void 0, void 0, function* () {
                session = yield storage.read(sessionId);
                if (session.status === 'error') {
                    throw new CustomError('AppError', session.error);
                }
                if (session.status === 'canceled') {
                    throw new CustomError('AppCanceled', errors.userCanceled[locale]);
                }
                return checkFn(session);
            }), { interval: 200, timeout });
            return storage.read(sessionId);
        }
        catch (err) {
            if (session && ['error', 'canceled'].includes(session.status) === false) {
                throw new CustomError('TimeoutError', `${reason} within ${timeout}ms`);
            }
            throw err;
        }
    });
    const waitForAppConnect = (sessionId, timeout, locale) => waitForSession(sessionId, timeout, (x) => Array.isArray(x.requestedClaims) && x.requestedClaims.length > 0, 'Requested claims not provided by app', locale);
    const waitForAppApprove = (sessionId, timeout, locale) => waitForSession(sessionId, timeout, (x) => Array.isArray(x.approveResults) && typeof x.approveResults[x.currentStep] !== 'undefined', 'Response claims not handled by app', locale);
    const handleClaimResponse = (context) => __awaiter(this, void 0, void 0, function* () {
        const { sessionId, session, body, locale, didwallet } = context;
        try {
            if (isValidContext(context) === false) {
                throw new CustomError('CONTEXT_INVALID', 'Invalid context');
            }
            if (storage.isFinalized(session.status)) {
                throw new CustomError('SESSION_FINALIZED', `Session finalized as ${session.status}${session.error ? `: ${session.error}` : ''}`);
            }
            const { userDid, userPk, action, challenge, claims } = yield authenticator.verify(body, locale);
            let newSession;
            // Ensure user approval
            if (action === 'declineAuth') {
                throw new CustomError('RejectError', errors.userDeclined[locale]);
            }
            // Ensure challenge match
            if (challenge !== session.challenge) {
                throw new Error(errors.challengeMismatch[locale]);
            }
            const handleWalletApprove = () => __awaiter(this, void 0, void 0, function* () {
                logger.debug('session.walletApproved', sessionId);
                yield storage.update(sessionId, {
                    status: 'walletApproved',
                    responseClaims: [...session.responseClaims, claims],
                });
                wsServer.broadcast(sessionId, {
                    status: 'walletApproved',
                    responseClaims: (0, isEmpty_1.default)(claims) ? [session.currentConnected] : claims,
                    currentStep: session.currentStep,
                    challenge: session.challenge,
                });
                newSession = yield waitForAppApprove(sessionId, session.timeout.app, locale);
                yield storage.update(sessionId, { status: 'appApproved' });
                wsServer.broadcast(sessionId, {
                    status: 'appApproved',
                    approveResult: newSession.approveResults[session.currentStep],
                });
            });
            // If wallet is submitting authPrincipal claim,
            // move to walletConnected and wait for appConnected
            // once appConnected we return the first claim
            if (session.status === 'walletScanned') {
                logger.debug('session.walletConnected', sessionId);
                yield storage.update(sessionId, { status: 'walletConnected', currentConnected: { userDid, userPk } });
                wsServer.broadcast(sessionId, { status: 'walletConnected', userDid, userPk, wallet: didwallet });
                // If this is a connect-only session, end it: walletApprove --> appApprove --> complete
                if (session.onlyConnect) {
                    yield handleWalletApprove();
                    logger.debug('session.completed', sessionId);
                    yield storage.update(sessionId, { status: 'completed' });
                    wsServer.broadcast(sessionId, { status: 'completed' });
                    return signJson(newSession.approveResults[session.currentStep], context);
                }
                // If our claims are populated already, move to appConnected without waiting
                if (session.requestedClaims.length > 0) {
                    newSession = yield storage.update(sessionId, { status: 'appConnected' });
                    wsServer.broadcast(sessionId, { status: 'appConnected', requestedClaims: newSession.requestedClaims });
                }
                else {
                    newSession = yield waitForAppConnect(sessionId, session.timeout.app, locale);
                    yield storage.update(sessionId, { status: 'appConnected' });
                    wsServer.broadcast(sessionId, { status: 'appConnected', requestedClaims: newSession.requestedClaims });
                }
                logger.debug('session.appConnected', sessionId);
                return signClaims(newSession.requestedClaims[session.currentStep], Object.assign(Object.assign({}, context), { session: newSession }));
            }
            // Ensure submitted claims match with requested
            const responseTypes = claims.map((x) => x.type);
            let requestedClaims = session.requestedClaims[session.currentStep];
            requestedClaims = Array.isArray(requestedClaims) ? requestedClaims : [requestedClaims];
            const requestedTypes = requestedClaims.map((x) => x.type);
            if ((0, isEqual_1.default)(responseTypes, requestedTypes) === false) {
                throw new Error(errors.claimMismatch[locale]);
            }
            // Move to walletApproved state and wait for appApproved
            yield handleWalletApprove();
            // Return result if we've done
            const isDone = session.currentStep === session.requestedClaims.length - 1;
            if (isDone) {
                logger.debug('session.completed', sessionId);
                yield storage.update(sessionId, { status: 'completed' });
                wsServer.broadcast(sessionId, { status: 'completed' });
                return signJson(newSession.approveResults[session.currentStep], context);
            }
            // Move on to next step if we are not the last step
            logger.debug('session.nextClaim', sessionId);
            const nextStep = session.currentStep + 1;
            const nextChallenge = getStepChallenge();
            newSession = yield storage.update(sessionId, { currentStep: nextStep, challenge: nextChallenge });
            return signClaims(session.requestedClaims[nextStep], Object.assign(Object.assign({}, context), { session: newSession }));
        }
        catch (err) {
            logger.error(err);
            // error reported by dapp
            if (err.code === 'AppError') {
                logger.debug('session.error', sessionId);
                wsServer.broadcast(sessionId, { status: 'error', error: err.message, source: 'app' });
                return signJson({ error: err.message }, context);
            }
            // error reported by dapp
            if (err.code === 'AppCanceled') {
                logger.debug('session.canceled', sessionId);
                wsServer.broadcast(sessionId, { status: 'canceled', error: err.message, source: 'app' });
                return signJson({ error: err.message }, context);
            }
            // timeout error
            if (err.code === 'TimeoutError') {
                logger.debug('session.timeout', sessionId);
                yield storage.update(sessionId, { status: 'timeout', error: err.message });
                wsServer.broadcast(sessionId, { status: 'timeout', error: err.message, source: 'timer' });
                return signJson({ error: err.message }, context);
            }
            // reject error
            if (err.code === 'RejectError') {
                logger.debug('session.rejected', sessionId);
                yield storage.update(sessionId, { status: 'rejected', error: err.message });
                wsServer.broadcast(sessionId, { status: 'rejected', error: err.message, source: 'wallet' });
                return signJson({}, context);
            }
            // anything else
            logger.debug('session.error', sessionId);
            yield storage.update(sessionId, { status: 'error', error: err.message });
            wsServer.broadcast(sessionId, { status: 'error', error: err.message, code: err.code });
            return signJson({ error: err.message }, context);
        }
    });
    return {
        handleSessionCreate,
        handleSessionRead,
        handleSessionUpdate,
        handleClaimRequest,
        handleClaimResponse,
        parseWalletUA,
        wsServer,
    };
}
exports.createHandlers = createHandlers;
