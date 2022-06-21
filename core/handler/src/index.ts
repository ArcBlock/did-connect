import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import waitFor from 'p-wait-for';
import { verify, decode } from '@arcblock/jwt';
// @ts-ignore
import objectHash from 'object-hash';
// @ts-ignore
import { WsServer } from '@arcblock/ws';
import { isValid } from '@arcblock/did';
import { SessionStorage } from '@did-connect/storage';
import {
  Session,
  TSession,
  Context,
  TContext,
  TDidWalletInfo,
  LocaleType,
  TAnyObject,
  TAnyResponse,
  TAnyRequest,
  CustomError,
  TAuthPrincipalRequest,
  TAuthPrincipalResponse,
  TI18nMessages,
} from '@did-connect/types';
import { Authenticator, AppResponseSigned, WalletResponseSigned } from '@did-connect/authenticator';

import { getStepChallenge, parseWalletUA } from './util';

const errors: TI18nMessages = {
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

export type LoggerType = {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
};

export function createSocketServer(logger: LoggerType, pathname: string) {
  return new WsServer({ logger, pathname });
}

export interface HandlersType {
  handleSessionCreate(context: TContext): Promise<SessionUpdateResult>;
  handleSessionRead(sessionId: string): Promise<SessionUpdateResult>;
  handleSessionUpdate(context: TContext): Promise<SessionUpdateResult>;
  handleClaimRequest(context: TContext): Promise<AppResponseSigned>;
  handleClaimResponse(context: TContext): Promise<AppResponseSigned>;
  parseWalletUA(ua: string): TDidWalletInfo;
  wsServer: any;
}

export type SessionCreateContext = TContext & {
  body: TSession;
};

export type SessionUpdateContext = TContext & {
  session: TSession;
  body: TSession & {
    status?: 'error' | 'canceled';
    error?: string;
  };
};

export type SessionUpdateResult = TSession | { error: string; code: string };

export type WalletHandlerContext = TContext & {
  session: TSession;
  body: WalletResponseSigned;
  locale: LocaleType;
};

// FIXME: i18n for all errors
export function createHandlers({
  storage,
  authenticator,
  logger = console,
  socketPathname = '/api/connect/relay/websocket',
}: {
  storage: SessionStorage;
  authenticator: Authenticator;
  logger?: LoggerType;
  socketPathname?: string;
}): HandlersType {
  const wsServer = createSocketServer(logger, socketPathname);

  const isValidContext = (x: TContext): boolean => {
    const { error } = Context.validate(x);
    if (error) logger.error(error);
    return !error;
  };

  const signJson = authenticator.signJson.bind(authenticator);
  const signClaims = authenticator.signClaims.bind(authenticator);

  const verifyUpdater = (params: TAnyObject, updaterPk?: string): { error: string; code: string } => {
    const { body, signerPk, signerToken } = params;
    if (!signerPk) {
      return { error: 'Invalid updater pk', code: 'UPDATER_PK_EMPTY' };
    }
    if (!signerToken) {
      return { error: 'Invalid token', code: 'SIGNATURE_EMPTY' };
    }

    if (verify(signerToken, signerPk) === false) {
      return { error: 'Invalid updater signature', code: 'SIGNATURE_INVALID' };
    }

    if (updaterPk && updaterPk !== signerPk) {
      return { error: 'Invalid updater', code: 'UPDATER_MISMATCH' };
    }

    const hash = objectHash(body);
    const decoded = decode(signerToken);
    if (decoded.hash !== hash) {
      return { error: 'Invalid payload hash', code: 'PAYLOAD_HASH_MISMATCH' };
    }

    return { error: '', code: 'OK' };
  };

  const handleSessionCreate = async (context: SessionCreateContext): Promise<SessionUpdateResult> => {
    if (isValidContext(context) === false) {
      return { error: 'Invalid context', code: 'CONTEXT_INVALID' };
    }

    const {
      sessionId,
      updaterPk,
      strategy = 'default',
      authUrl,
      autoConnect = true,
      onlyConnect = false,
      requestedClaims = [],
      timeout,
    } = context.body;

    if (sessionId.length !== 21) {
      return { error: 'Invalid sessionId', code: 'SESSION_ID_INVALID' };
    }

    const result = verifyUpdater(context);
    if (result.error) {
      return result;
    }

    const session: TSession = {
      sessionId,
      status: 'created',
      updaterPk,
      strategy,
      authUrl,
      challenge: getStepChallenge(),
      autoConnect,
      onlyConnect,
      // FIXME: app link should be updated according to blocklet env?
      appInfo: await authenticator.getAppInfo({ ...context, baseUrl: new URL(authUrl).origin }),
      previousConnected: context.previousConnected,
      currentConnected: null,
      currentStep: 0,
      requestedClaims, // app requested claims, authPrincipal should not be listed here
      responseClaims: [], // wallet submitted claims
      approveResults: [],
      timeout,
      error: '',
    };

    const { value, error } = Session.validate(session);
    if (error) {
      return {
        error: `Invalid session updates: ${error.details.map((x: any) => x.message).join(', ')}`,
        code: 'SESSION_UPDATE_INVALID',
      };
    }

    logger.debug('session.created', sessionId);
    return storage.create(sessionId, value);
  };

  const handleSessionRead = async (sessionId: string): Promise<SessionUpdateResult> => {
    return storage.read(sessionId);
  };

  const handleSessionUpdate = async (context: SessionUpdateContext): Promise<SessionUpdateResult> => {
    const { body, session, sessionId } = context;
    try {
      if (isValidContext(context) === false) {
        throw new CustomError('CONTEXT_INVALID', 'Invalid context');
      }

      if (storage.isFinalized(session.status)) {
        throw new CustomError(
          'SESSION_FINALIZED',
          `Session finalized as ${session.status}${session.error ? `: ${session.error}` : ''}`
        );
      }

      const result = verifyUpdater(context, session.updaterPk);
      if (result.error) {
        throw new CustomError(result.code, result.error);
      }

      if (body.status && ['error', 'canceled'].includes(body.status) === false) {
        throw new CustomError('SESSION_STATUS_INVALID', 'Can only update session status to error or canceled');
      }

      const { error, value } = Session.validate({ ...session, ...body });
      if (error) {
        throw new CustomError(
          'SESSION_UPDATE_INVALID',
          `Invalid session updates: ${error.details.map((x: any) => x.message).join(', ')}`
        );
      }

      const updates = pick(value, ['error', 'status', 'approveResults', 'requestedClaims']);
      logger.info('update session', context.sessionId, updates);
      return await storage.update(context.sessionId, updates);
    } catch (err: any) {
      logger.error(err);
      wsServer.broadcast(sessionId, { status: 'error', error: err.message });
      await storage.update(sessionId, { status: 'error', error: err.message });
      return { error: err.message, code: err.code };
    }
  };

  const getAuthPrincipalRequest = (session: TSession): TAuthPrincipalRequest => {
    const { strategy, previousConnected, onlyConnect } = session;
    return {
      type: 'authPrincipal',
      description: 'select the principal to be used for authentication',
      target: isValid(strategy) ? strategy : '',
      supervised: onlyConnect || !!previousConnected,
    };
  };

  const handleClaimRequest = async (context: WalletHandlerContext): Promise<AppResponseSigned> => {
    const { sessionId, session, didwallet } = context;

    try {
      if (isValidContext(context) === false) {
        throw new CustomError('CONTEXT_INVALID', 'Invalid context');
      }

      if (storage.isFinalized(session.status)) {
        throw new CustomError(
          'SESSION_FINALIZED',
          `Session finalized as ${session.status}${session.error ? `: ${session.error}` : ''}`
        );
      }

      // if we are in created status, we should return authPrincipal claim
      if (session.status === 'created') {
        logger.debug('session.walletScanned', sessionId);
        wsServer.broadcast(sessionId, { status: 'walletScanned', didwallet });
        await storage.update(sessionId, { status: 'walletScanned' });

        return signClaims([getAuthPrincipalRequest(session)], context);
      }

      // else we should perform a step by step style
      return signClaims(session.requestedClaims[session.currentStep], context);
    } catch (err: any) {
      logger.error(err);
      wsServer.broadcast(sessionId, { status: 'error', error: err.message });
      await storage.update(sessionId, { status: 'error', error: err.message });
      return signJson({ error: err.message }, context);
    }
  };

  const waitForSession = async (
    sessionId: string,
    timeout: number,
    checkFn: Function,
    reason: string,
    locale: LocaleType
  ): Promise<TSession> => {
    let session: Partial<TSession> = {};
    try {
      await waitFor(
        async () => {
          session = await storage.read(sessionId);
          if (session.status === 'error') {
            throw new CustomError('AppError', session.error as string);
          }
          if (session.status === 'canceled') {
            throw new CustomError('AppCanceled', errors.userCanceled[locale]);
          }

          return checkFn(session);
        },
        { interval: 200, timeout }
      );
      return await storage.read(sessionId);
    } catch (err) {
      if (session && ['error', 'canceled'].includes(session.status as string) === false) {
        throw new CustomError('TimeoutError', `${reason} within ${timeout}ms`);
      }

      throw err;
    }
  };

  const waitForAppConnect = (sessionId: string, timeout: number, locale: LocaleType): Promise<TSession> =>
    waitForSession(
      sessionId,
      timeout,
      (x: TSession) => x.requestedClaims.length > 0,
      'Requested claims not provided by app',
      locale
    );

  const waitForAppApprove = (sessionId: string, timeout: number, locale: LocaleType): Promise<TSession> =>
    waitForSession(
      sessionId,
      timeout,
      (x: TSession) => Array.isArray(x.approveResults) && typeof x.approveResults[x.currentStep] !== 'undefined',
      'Response claims not handled by app',
      locale
    );

  const handleClaimResponse = async (context: WalletHandlerContext): Promise<AppResponseSigned> => {
    const { sessionId, session, body, locale, didwallet } = context;
    try {
      if (isValidContext(context) === false) {
        throw new CustomError('CONTEXT_INVALID', 'Invalid context');
      }

      if (storage.isFinalized(session.status)) {
        throw new CustomError(
          'SESSION_FINALIZED',
          `Session finalized as ${session.status}${session.error ? `: ${session.error}` : ''}`
        );
      }

      const { userDid, userPk, action, challenge, claims } = await authenticator.verify(body, locale);

      // Ensure user approval
      if (action === 'declineAuth') {
        throw new CustomError('RejectError', errors.userDeclined[locale]);
      }

      // Ensure challenge match
      if (challenge !== session.challenge) {
        throw new Error(errors.challengeMismatch[locale]);
      }

      const handleWalletApprove = async (): Promise<TSession> => {
        logger.debug('session.walletApproved', sessionId);
        const justifiedClaims = isEmpty(claims)
          ? [{ ...(getAuthPrincipalRequest(session) as TAuthPrincipalResponse), ...session.currentConnected }]
          : claims;
        await storage.update(sessionId, {
          status: 'walletApproved',
          responseClaims: [...session.responseClaims, justifiedClaims],
        });
        wsServer.broadcast(sessionId, {
          status: 'walletApproved',
          responseClaims: justifiedClaims,
          currentStep: session.currentStep,
          challenge: session.challenge,
        });
        await waitForAppApprove(sessionId, session.timeout.app, locale);
        wsServer.broadcast(sessionId, { status: 'appApproved' });
        return storage.update(sessionId, { status: 'appApproved' });
      };

      let newSession: TSession;

      // If wallet is submitting authPrincipal claim,
      // move to walletConnected and wait for appConnected
      // once appConnected we return the first claim
      if (session.status === 'walletScanned') {
        logger.debug('session.walletConnected', sessionId);
        await storage.update(sessionId, {
          status: 'walletConnected',
          currentConnected: { userDid, userPk, didwallet },
        });
        wsServer.broadcast(sessionId, {
          status: 'walletConnected',
          currentConnected: { userDid, userPk, didwallet },
        });

        // If this is a connect-only session, end it: walletApprove --> appApprove --> complete
        if (session.onlyConnect) {
          newSession = await handleWalletApprove();
          logger.debug('session.completed', sessionId);
          await storage.update(sessionId, { status: 'completed' });
          wsServer.broadcast(sessionId, { status: 'completed' });
          return signJson(newSession.approveResults[session.currentStep], context);
        }

        // If our claims are populated already, move to appConnected without waiting
        if (session.requestedClaims.length > 0) {
          newSession = await storage.update(sessionId, { status: 'appConnected' });
        } else {
          newSession = await waitForAppConnect(sessionId, session.timeout.app, locale);
          await storage.update(sessionId, { status: 'appConnected' });
        }
        wsServer.broadcast(sessionId, { status: 'appConnected', requestedClaims: newSession.requestedClaims });
        logger.debug('session.appConnected', sessionId);
        return signClaims(newSession.requestedClaims[session.currentStep], { ...context, session: newSession });
      }

      // Ensure submitted claims match with requested
      const responseTypes = claims.map((x: TAnyResponse) => x.type);
      let requestedClaims = session.requestedClaims[session.currentStep];
      requestedClaims = Array.isArray(requestedClaims) ? requestedClaims : [requestedClaims];
      const requestedTypes = requestedClaims.map((x: TAnyRequest) => x.type);
      if (isEqual(responseTypes, requestedTypes) === false) {
        throw new Error(errors.claimMismatch[locale]);
      }

      // Move to walletApproved state and wait for appApproved
      newSession = await handleWalletApprove();

      // Return result if we've done
      const isDone = session.currentStep === session.requestedClaims.length - 1;
      if (isDone) {
        logger.debug('session.completed', sessionId);
        await storage.update(sessionId, { status: 'completed' });
        wsServer.broadcast(sessionId, { status: 'completed' });
        return signJson(newSession.approveResults[session.currentStep], context);
      }

      // Move on to next step if we are not the last step
      logger.debug('session.nextClaim', sessionId);
      const nextStep = session.currentStep + 1;
      const nextChallenge = getStepChallenge();
      newSession = await storage.update(sessionId, { currentStep: nextStep, challenge: nextChallenge });
      return signClaims(session.requestedClaims[nextStep], { ...context, session: newSession });
    } catch (err: any) {
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
        await storage.update(sessionId, { status: 'timeout', error: err.message });
        wsServer.broadcast(sessionId, { status: 'timeout', error: err.message, source: 'timer' });
        return signJson({ error: err.message }, context);
      }

      // reject error
      if (err.code === 'RejectError') {
        logger.debug('session.rejected', sessionId);
        await storage.update(sessionId, { status: 'rejected', error: err.message });
        wsServer.broadcast(sessionId, { status: 'rejected', error: err.message, source: 'wallet' });
        return signJson({}, context);
      }

      // anything else
      logger.debug('session.error', sessionId);
      await storage.update(sessionId, { status: 'error', error: err.message });
      wsServer.broadcast(sessionId, { status: 'error', error: err.message, code: err.code });
      return signJson({ error: err.message }, context);
    }
  };

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
