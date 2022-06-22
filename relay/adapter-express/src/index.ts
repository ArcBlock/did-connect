/* eslint-disable @typescript-eslint/indent */
import get from 'lodash/get';
import type { THandlers, TSessionUpdateResult } from '@did-connect/handler';
import type { Request, Response, NextFunction } from 'express';
import type { TContext, TLocaleCode, TSession, TWalletInfo, TAnyObject } from '@did-connect/types';

export interface TRequest extends Request {
  query: TAnyObject;
  body: TAnyObject;
  cookies: TAnyObject;
  context: TContext;
}

export interface TResponse extends Response {}

export function attachHandlers(router: any, handlers: THandlers, prefix: string = '/api/connect/relay') {
  const {
    handleSessionCreate,
    handleSessionRead,
    handleSessionUpdate,
    handleClaimRequest,
    handleClaimResponse,
    parseWalletUA,
  } = handlers;

  const getPreviousConnected = (req: TRequest): any => {
    const userDid = get(req, 'cookies.connected_did', '');

    if (userDid) {
      return {
        userDid,
        userPk: get(req, 'cookies.connected_pk', ''),
        didwallet: get(req, 'cookies.connected_wallet', ''),
      };
    }

    return null;
  };

  const ensureContext =
    (isSessionRequired = true) =>
    async (req: TRequest, res: TResponse, next: NextFunction) => {
      let sessionId: string = '';

      // @ts-ignore
      let session: TSession = null;

      if (isSessionRequired) {
        sessionId = req.query.sid;
        if (!sessionId) {
          return res.status(400).jsonp({ error: 'No sessionId', code: 'SESSION_ID_EMPTY' });
        }
        if (sessionId.length !== 21) {
          return res.status(400).jsonp({ error: `Invalid sessionId: ${sessionId}`, code: 'SESSION_ID_INVALID' });
        }

        session = await handleSessionRead(sessionId);
        if (!session) {
          return res.status(400).jsonp({ error: `Session not found: ${sessionId}`, code: 'SESSION_NOT_FOUND' });
        }
      }

      // extra context
      const didwallet: TWalletInfo = parseWalletUA(req.query['user-agent'] || req.headers['user-agent']);
      const locale: TLocaleCode = (req.query.locale || req.acceptsLanguages('en-US', 'zh-CN') || 'en-US')
        .split('-')
        .shift();

      const context: TContext = {
        didwallet,
        body: req.method === 'GET' ? req.query : req.body,
        headers: req.headers,
        sessionId,
        session,
        locale,
        signerPk: req.get('x-updater-pk') || '',
        signerToken: req.get('x-updater-token') || '',
        previousConnected: getPreviousConnected(req),
      };

      req.context = context;

      return next();
    };

  // web: create new session
  router.post(`${prefix}/session`, ensureContext(false), async (req: TRequest, res: TResponse) => {
    const result: TSessionUpdateResult = await handleSessionCreate(req.context);
    res.jsonp(result);
  });

  // web: get session
  router.get(`${prefix}/session`, ensureContext(true), (req: TRequest, res: TResponse) => {
    res.jsonp(req.context.session);
  });

  // web: update session
  router.put(`${prefix}/session`, ensureContext(true), async (req: TRequest, res: TResponse) => {
    const result: TSessionUpdateResult = await handleSessionUpdate(req.context);
    res.jsonp(result);
  });

  // wallet: get requested claims
  router.get(`${prefix}/auth`, ensureContext(true), async (req: TRequest, res: TResponse) => {
    const result = await handleClaimRequest(req.context);
    res.jsonp(result);
  });

  // Wallet: submit requested claims
  router.post(`${prefix}/auth`, ensureContext(true), async (req: TRequest, res: TResponse) => {
    const result = await handleClaimResponse(req.context);
    res.jsonp(result);
  });

  // Wallet: submit auth response for web wallet
  router.get(`${prefix}/auth/submit`, ensureContext(true), async (req: TRequest, res: TResponse) => {
    const result = await handleClaimResponse(req.context);
    res.jsonp(result);
  });
}
