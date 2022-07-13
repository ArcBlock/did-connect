import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import waitFor from 'p-wait-for';
import { verify, decode } from '@arcblock/jwt';
import axios, { AxiosResponse } from 'axios';
// @ts-ignore
import objectHash from 'object-hash';
// @ts-ignore
import { WsServer } from '@arcblock/ws';
import { isValid } from '@arcblock/did';
import { SessionStorage } from '@did-connect/storage';
import { Session, Context, CustomError, isRequestList } from '@did-connect/types';
import { Authenticator } from '@did-connect/authenticator';

import type { JwtBody } from '@arcblock/jwt';
import type { Promisable } from 'type-fest';
import type { TAppResponseSigned, TWalletResponseSigned } from '@did-connect/authenticator';
import type {
  TSession,
  TContext,
  TAuthContext,
  TWalletInfo,
  TLocaleCode,
  TAnyObject,
  TAnyResponse,
  TAnyRequest,
  TAuthPrincipalRequest,
  TI18nMessages,
} from '@did-connect/types';

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

export type TLogger = {
  debug(...args: any[]): void;
  info(...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
};

export type TSessionUpdateResult = TSession | { code: string; error?: string };

export interface THandlers {
  handleSessionCreate(context: TContext): Promisable<TSessionUpdateResult>;
  handleSessionRead(sessionId: string): Promisable<TSession>;
  handleSessionUpdate(context: TContext): Promisable<TSessionUpdateResult>;
  handleSessionDelete(context: TContext): Promisable<TSessionUpdateResult>;
  handleClaimRequest(context: TAuthContext): Promisable<TAppResponseSigned>;
  handleClaimResponse(context: TAuthContext): Promisable<TAppResponseSigned>;
  parseWalletUA(ua: string): TWalletInfo;
  wsServer: any;
}

export type TSessionCreateContext = TAuthContext & {
  body: TSession;
};

export type TSessionUpdateContext = TAuthContext & {
  session: TSession;
  body: TSession & {
    status?: 'error' | 'canceled';
    error?: string;
  };
};

export type TWalletHandlerContext = TAuthContext & {
  session: TSession;
  body: TWalletResponseSigned;
  locale: TLocaleCode;
};

export function createSocketServer(logger: TLogger, pathname: string) {
  return new WsServer({ logger, pathname });
}

// FIXME: i18n for all errors
export function createHandlers({
  storage,
  authenticator,
  logger = console,
  socketPathname = '/api/connect/relay/websocket',
}: {
  storage: SessionStorage;
  authenticator: Authenticator;
  logger?: TLogger;
  socketPathname?: string;
}): THandlers {
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
    const decoded: JwtBody = decode(signerToken);
    if (decoded.hash !== hash) {
      logger.debug('hash mismatch', decoded.hash, hash, body, decoded);
      return { error: 'Invalid payload hash', code: 'PAYLOAD_HASH_MISMATCH' };
    }

    return { error: '', code: 'OK' };
  };

  const handleSessionCreate = async (context: TSessionCreateContext): Promise<TSessionUpdateResult> => {
    if (isValidContext(context) === false) {
      return { error: 'Invalid context', code: 'CONTEXT_INVALID' };
    }

    const {
      sessionId,
      updaterPk,
      strategy = 'default',
      authUrl,
      connectUrl = '',
      approveUrl = '',
      autoConnect = true,
      onlyConnect = false,
      requestedClaims = [],
      timeout,
    } = context.body;

    if (sessionId.length !== 21) {
      return { error: 'Invalid sessionId', code: 'SESSION_ID_INVALID' };
    }

    let result = verifyUpdater(context);
    if (result.error) {
      return result;
    }

    const session: TSession = {
      sessionId,
      status: 'created',
      updaterPk,
      strategy,
      authUrl,
      connectUrl,
      approveUrl,
      challenge: getStepChallenge(),
      autoConnect,
      onlyConnect,
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

    if (Array.isArray(session.requestedClaims)) {
      result = isRequestList(session.requestedClaims);
      if (result.error) {
        return result;
      }
    }

    const { value, error } = Session.validate(session);
    if (error) {
      return {
        error: `Invalid session props: ${error.details.map((x: any) => x.message).join(', ')}`,
        code: 'SESSION_UPDATE_INVALID',
      };
    }

    logger.debug('session.created', sessionId);
    return storage.create(sessionId, value);
  };

  const handleSessionRead = async (sessionId: string): Promise<TSession> => {
    return storage.read(sessionId);
  };

  const handleSessionUpdate = async (context: TSessionUpdateContext): Promise<TSessionUpdateResult> => {
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

      let result = verifyUpdater(context, session.updaterPk);
      if (result.error) {
        throw new CustomError(result.code, result.error);
      }

      if (body.status && ['error', 'canceled'].includes(body.status) === false) {
        throw new CustomError('SESSION_STATUS_INVALID', 'Can only update session status to error or canceled');
      }

      if (Array.isArray(body.requestedClaims)) {
        result = isRequestList(body.requestedClaims);
        if (result.error) {
          throw new CustomError(result.code, result.error);
        }
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

  const handleSessionDelete = async (context: TSessionUpdateContext): Promise<TSessionUpdateResult> => {
    const { session, sessionId } = context;
    const result = verifyUpdater(context, session.updaterPk);
    if (result.error) {
      return result;
    }

    await storage.delete(sessionId);
    return { code: 'OK' };
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

  const handleClaimRequest = async (context: TWalletHandlerContext): Promise<TAppResponseSigned> => {
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
    locale: TLocaleCode
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

  const waitForAppConnect = (sessionId: string, timeout: number, locale: TLocaleCode): Promise<TSession> =>
    waitForSession(
      sessionId,
      timeout,
      (x: TSession) => x.requestedClaims.length > 0,
      'Requested claims not provided by app',
      locale
    );

  const waitForAppApprove = (sessionId: string, timeout: number, locale: TLocaleCode): Promise<TSession> =>
    waitForSession(
      sessionId,
      timeout,
      (x: TSession) => Array.isArray(x.approveResults) && typeof x.approveResults[x.currentStep] !== 'undefined',
      'Response claims not handled by app',
      locale
    );

  const fetchRequestList = async (session: TSession, locale: TLocaleCode): Promise<TAnyRequest[][]> => {
    try {
      const result: AxiosResponse = await axios.post(
        session.connectUrl as string,
        {
          ...pick(session, ['sessionId', 'currentConnected']),
          locale,
        },
        { timeout: session.timeout.app }
      );

      if (result.data.error) {
        throw new CustomError('AppError', result.data.error);
      }

      const { code, error } = isRequestList(result.data);
      if (code !== 'OK') {
        throw new CustomError('AppError', error);
      }

      return result.data;
    } catch (err: any) {
      throw new CustomError('AppError', `Failed to get request list from URL: ${session.connectUrl}: ${err.message}`);
    }
  };

  const fetchApproveResult = async (session: TSession, locale: TLocaleCode): Promise<TAnyObject> => {
    try {
      const result: AxiosResponse = await axios.post(
        session.approveUrl as string,
        {
          ...pick(session, [
            'sessionId',
            'challenge',
            'currentStep',
            'currentConnected',
            'requestedClaims',
            'responseClaims',
            'approveResults',
          ]),
          locale,
        },
        { timeout: session.timeout.app }
      );

      return result.data;
    } catch (err: any) {
      throw new CustomError('AppError', `Failed to get response from URL: ${session.approveUrl}: ${err.message}`);
    }
  };

  const handleClaimResponse = async (context: TWalletHandlerContext): Promise<TAppResponseSigned> => {
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
        // @ts-ignore
        const justifiedClaims: TAnyResponse[] = (isEmpty(claims) ? [{ type: 'authPrincipal' }] : claims).map(
          (x: any) => {
            if (x.type === 'authPrincipal') {
              return {
                ...x,
                ...(session.currentConnected || { userDid, userPk }),
              };
            }
            return x;
          }
        );
        logger.info('session.walletApproved', sessionId, justifiedClaims);
        const updated = await storage.update(sessionId, {
          status: 'walletApproved',
          responseClaims: [...session.responseClaims, justifiedClaims],
        });
        wsServer.broadcast(sessionId, {
          status: 'walletApproved',
          responseClaims: justifiedClaims,
          currentStep: session.currentStep,
          challenge: session.challenge,
        });

        // If we should fetch response from some url, fetch and verify
        if (session.approveUrl) {
          const approveResults = [...session.approveResults, await fetchApproveResult(updated, locale)];
          wsServer.broadcast(sessionId, { status: 'appApproved', approveResults });
          return storage.update(sessionId, { status: 'appApproved', approveResults });
        }

        // Otherwise wait for webapp to fill the approve results
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
        } else if (session.connectUrl) {
          // If we should fetch claims from some url, fetch and verify
          const requestedClaims = await fetchRequestList(session, locale);
          newSession = await storage.update(sessionId, { status: 'appConnected', requestedClaims });
        } else {
          // else wait for webapp to fill the claims
          newSession = await waitForAppConnect(sessionId, session.timeout.app, locale);
          await storage.update(sessionId, { status: 'appConnected' });
        }
        wsServer.broadcast(sessionId, { status: 'appConnected', requestedClaims: newSession.requestedClaims });
        logger.debug('session.appConnected', sessionId);
        return signClaims(newSession.requestedClaims[session.currentStep], { ...context, session: newSession });
      }

      // Ensure submitted claims match with requested
      const responseTypes = claims.map((x: TAnyResponse) => x.type);
      const requestedTypes = session.requestedClaims[session.currentStep].map((x: TAnyRequest) => x.type);
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
    handleSessionDelete,
    handleClaimRequest,
    handleClaimResponse,
    parseWalletUA,
    wsServer,
  };
}
