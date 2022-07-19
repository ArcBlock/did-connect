/* eslint-disable @typescript-eslint/indent */
/* eslint-disable import/no-extraneous-dependencies */
import axios from 'axios';
import * as Jwt from '@arcblock/jwt';
import { types } from '@ocap/mcrypto';
import { nanoid } from 'nanoid';
import { Request, Response } from 'express';
// @ts-ignore
import { WsClient } from '@arcblock/ws';
import { fromRandom, WalletObject } from '@ocap/wallet';
import { toBase58 } from '@ocap/util';
// @ts-ignore
import objectHash from 'object-hash';
// @ts-ignore
import waitFor from 'p-wait-for';
// @ts-ignore
import joinUrl from 'url-join';

import { SessionTimeout, TAnyRequest } from '@did-connect/types';
import type {
  TAppInfo,
  TAnyObject,
  TSession,
  TAuthContext,
  TAuthPrincipalRequest,
  TAuthPrincipalResponse,
  TProfileRequest,
  TProfileResponse,
  TAssetRequest,
  TAssetResponse,
  TAuthResponse,
  TAnyResponse,
} from '@did-connect/types';
import { MemoryStorage } from '@did-connect/storage-memory';
import { Authenticator } from '@did-connect/authenticator';
// @ts-ignore
import { attachHandlers } from '@did-connect/relay-adapter-express';
import { createHandlers } from '../src';

// @ts-ignore
const createTestServer = require('../../../scripts/create-test-server');

const noop = () => null;
const user = fromRandom();
const updater = fromRandom();
const evil = fromRandom();
const app = fromRandom({ role: types.RoleType.ROLE_APPLICATION });

const chainInfo = {
  host: 'https://beta.abtnetwork.io/api',
  id: 'beta',
};

const appInfo = ({ baseUrl }: TAuthContext): TAppInfo => ({
  name: 'DID Wallet Demo',
  description: 'Demo application to show the potential of DID Wallet',
  icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
  link: baseUrl as string,
  updateSubEndpoint: true,
  subscriptionEndpoint: '/api/websocket',
  nodeDid: 'z1Zg7PUWJX2NS9cRhpjuMtvjjLK5W2E3Wsh',
});

type TestSession = Partial<TSession>;

type RelayEvent = TSession & {
  responseClaims: TAnyResponse[];
};

const timeout = SessionTimeout;

const profileRequest: TProfileRequest = {
  type: 'profile',
  items: ['fullName', 'email', 'avatar'],
  description: 'Please give me your profile',
};
const profileResponse: TProfileResponse = {
  type: 'profile',
  fullName: 'test',
  email: 'test@arcblock.io',
  avatar: '123',
};

const assetRequest: TAssetRequest = {
  type: 'asset',
  description: 'Please prove that you own asset',
  address: user.address,
};
const assetResponse: TAssetResponse = {
  type: 'asset',
  asset: user.address,
  ownerDid: user.address,
  ownerPk: user.publicKey.toString(),
  ownerProof: 'abc',
};

describe('Handlers', () => {
  let server: any;
  let api: any;
  let client: any;
  let baseUrl: string;

  // eslint-disable-next-line consistent-return
  const doSignedRequest = async (
    data: any,
    wallet: WalletObject,
    url: string = '/api/connect/relay/session',
    method: string = 'POST',
    pk?: any,
    token?: any,
    hash?: any,
    extraHeaders: any = {}
  ) => {
    const headers: TAnyObject = {};
    headers['x-updater-pk'] = typeof pk === 'undefined' ? wallet.publicKey : pk;
    headers['x-updater-token'] =
      typeof token === 'undefined'
        ? Jwt.sign(wallet.address, wallet.secretKey as string, {
            hash: typeof hash === 'undefined' ? objectHash(data) : hash,
          })
        : token;

    const res = await api({
      method,
      url,
      data,
      headers: { ...headers, ...extraHeaders },
    });
    return res.data;
  };

  const getWsClient = async (endpoint: string) => {
    if (!client) {
      client = new WsClient(`${endpoint}/api/connect/relay`, { heartbeatIntervalMs: 10 * 1000 });
    }

    if (client.isConnected()) {
      return client;
    }

    return new Promise((resolve, reject) => {
      client.onOpen(() => {
        resolve(client);
      });

      client.onError((err: any) => {
        reject(new Error(`Failed to connect to daemon socket server: ${err.message}`));
      });

      client.connect();
    });
  };

  beforeAll(async () => {
    server = await createTestServer({
      routes: [
        {
          method: 'post',
          path: '/connect/error',
          handler: (req: Request, res: Response) => res.json({ error: 'connect error' }),
        },
        {
          method: 'post',
          path: '/connect/profile',
          handler: (req: Request, res: Response) => res.json([[profileRequest]]),
        },
        {
          method: 'get',
          path: '/approve/notfound',
          handler: (req: Request, res: Response) => res.json({ error: 'approve notfound' }),
        },
        {
          method: 'post',
          path: '/approve/profile',
          handler: (req: Request, res: Response) =>
            res.json({
              message: `you provided profile ${(req.body.responseClaims[0][0] as TProfileResponse).fullName}`,
            }),
        },
      ],
    });

    const storage = new MemoryStorage();
    const authenticator = new Authenticator({ wallet: app, appInfo, chainInfo });
    const logger = {
      // eslint-disable-next-line no-console
      info: process.env.CI ? noop : console.info,
      error: process.env.CI ? noop : console.error,
      warn: process.env.CI ? noop : console.warn,
      debug: noop,
    };
    const handlers = createHandlers({ storage, authenticator, logger });

    handlers.wsServer.attach(server.http);
    handlers.wsServer.attach(server.https);

    attachHandlers(server, handlers);

    baseUrl = server.url;
    api = axios.create({ baseURL: server.url });
    client = await getWsClient(baseUrl.replace('http:', 'ws:'));
  });

  const prepareTest = () => {
    const sessionId = nanoid();
    const updaterPk = updater.publicKey;

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${sessionId}`);
    const updateSession = (updates: any, wallet: WalletObject = updater, pk?: any, token?: any, hash?: any) =>
      doSignedRequest(updates, wallet, `/api/connect/relay/session?sid=${sessionId}`, 'PUT', pk, token, hash);
    const deleteSession = (wallet: WalletObject = updater, pk?: any, token?: any, hash?: any) =>
      doSignedRequest({}, wallet, `/api/connect/relay/session?sid=${sessionId}`, 'DELETE', pk, token, hash);
    const getSession = () => api.get(`/api/connect/relay/session?sid=${sessionId}`).then((x: any) => x.data);

    return { sessionId, updaterPk, authUrl, updateSession, deleteSession, getSession };
  };

  const getAuthUrl = (authUrl: string): string => {
    const obj = new URL(authUrl);
    obj.searchParams.set('user-agent', 'ArcWallet/3.0.0');
    return obj.href;
  };

  const runSingleTest = async (authUrl: string, statusHistory: string[], args: any, skipConnect: boolean = false) => {
    let res: any = {};
    let nextUrl: string;
    let challenge: string;
    let claims: TAnyRequest[];

    // @ts-ignore
    let authInfo: TAuthResponse = {};

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);

    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);

    if (skipConnect) {
      // @ts-ignore
      expect(authInfo.requestedClaims[0].type).toEqual('profile');
      claims = authInfo.requestedClaims;
      challenge = authInfo.challenge;
      nextUrl = getAuthUrl(authUrl);
    } else {
      // @ts-ignore
      expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
      expect(authInfo.url).toEqual(authUrl);

      // 3. submit auth principal
      claims = authInfo.requestedClaims;
      nextUrl = getAuthUrl(authUrl);
      challenge = authInfo.challenge; // eslint-disable-line
      if (claims.find((x) => x.type === 'authPrincipal')) {
        res = await api.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey as string, {
            requestedClaims: [],
            challenge: authInfo.challenge,
          }),
        });
        // @ts-ignore
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.requestedClaims[0].type).toEqual('profile');
        claims = authInfo.requestedClaims;
        challenge = authInfo.challenge;
        nextUrl = authInfo.url;
      }
    }

    // 4. submit requested claims
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [profileResponse],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('ok');
    expect(authInfo.response.message).toMatch(/profile test/);

    // 6. wait for complete
    await waitFor(() => args.completed);

    // 7. try to submit to a finalized session
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [profileResponse],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toMatch(/Session finalized/);

    // 8. assert status history
    expect(statusHistory).toEqual([
      'walletScanned',
      'walletConnected',
      'appConnected',
      'walletApproved',
      'appApproved',
      'completed',
      'error',
    ]);

    client.off(args.sessionId);
  };

  test('should connect complete when everything is working: single', async () => {
    let session: TestSession = {};

    const { sessionId, updaterPk, authUrl, updateSession, getSession } = prepareTest();
    const args = { completed: false, sessionId };
    const statusHistory: string[] = [];
    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({ requestedClaims: [[profileRequest]] });
      } else if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [{ message: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` }],
        });
      } else if (e.status === 'completed') {
        args.completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);

    await runSingleTest(authUrl, statusHistory, args);

    // assert session completed
    session = await getSession();
    expect(session.status).toEqual('error');

    // try to scan a finalized session
    const res = await api.get(getAuthUrl(authUrl));
    const authInfo: Jwt.JwtBody = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toMatch('Session finalized');
  });

  test('should connect complete when everything is working: single + smart (not-connected)', async () => {
    let session: TestSession = {};

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();
    const args = { completed: false, sessionId };
    const statusHistory: string[] = [];
    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({ requestedClaims: [[profileRequest]] });
      } else if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [{ message: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` }],
        });
      } else if (e.status === 'completed') {
        args.completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout, strategy: 'smart' }, updater);
    expect(session.sessionId).toEqual(sessionId);

    await runSingleTest(authUrl, statusHistory, args);
  });

  test('should connect complete when everything is working: single + smart (connected)', async () => {
    let session: TestSession = {};

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();
    const args = { completed: false, sessionId };
    const statusHistory: string[] = [];
    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({ requestedClaims: [[profileRequest]] });
      } else if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [{ message: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` }],
        });
      } else if (e.status === 'completed') {
        args.completed = true;
      }
    });

    // 1. create session
    const cookies: TAnyObject = {
      connected_did: user.address,
      connected_pk: user.publicKey,
      connected_wallet_os: 'ios',
    };
    session = await doSignedRequest(
      { sessionId, updaterPk, authUrl, timeout, strategy: 'smart' },
      updater,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        Cookie: Object.keys(cookies)
          .map((x) => `${x}=${cookies[x]}`)
          .join('; '),
      }
    );
    expect(session.sessionId).toEqual(sessionId);

    await runSingleTest(authUrl, statusHistory, args, true);
  });

  test('should connect complete when everything is working: single + connectUrl + approveUrl', async () => {
    let session: TestSession = {};

    const { sessionId, updaterPk, authUrl, getSession } = prepareTest();
    const args = { completed: false, sessionId };
    const statusHistory: string[] = [];
    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'completed') {
        args.completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest(
      {
        sessionId,
        updaterPk,
        authUrl,
        connectUrl: joinUrl(baseUrl, '/connect/profile'),
        approveUrl: joinUrl(baseUrl, '/approve/profile'),
        timeout,
      },
      updater
    );
    expect(session.sessionId).toEqual(sessionId);

    await runSingleTest(authUrl, statusHistory, args);

    // assert session completed
    session = await getSession();
    expect(session.status).toEqual('error');

    // try to scan a finalized session
    const res = await api.get(getAuthUrl(authUrl));
    const authInfo: Jwt.JwtBody = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toMatch('Session finalized');
  });

  test('should connect complete when everything is working: single + pre-populated', async () => {
    let session: TestSession = {};

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    const args = { completed: false, sessionId };
    const statusHistory: string[] = [];
    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [{ message: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` }],
        });
      }
      if (e.status === 'completed') {
        args.completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest(
      { sessionId, updaterPk, authUrl, timeout, requestedClaims: [[profileRequest]] },
      updater
    );
    expect(session.sessionId).toEqual(sessionId);

    await runSingleTest(authUrl, statusHistory, args);
  });

  const runMultiStepTest = async (authUrl: string, statusHistory: string[], args: any) => {
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    let claims = authInfo.requestedClaims;
    let nextUrl = getAuthUrl(authUrl);
    let challenge = authInfo.challenge; // eslint-disable-line
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('profile');
      claims = authInfo.requestedClaims;
      challenge = authInfo.challenge;
      nextUrl = authInfo.url;
    }

    // 4. submit profile claim
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [profileResponse],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('asset');
    claims = authInfo.requestedClaims;
    challenge = authInfo.challenge;
    nextUrl = authInfo.url;

    // 4. submit asset claim
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [assetResponse],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('ok');
    expect(authInfo.response.message).toMatch(/you provided asset/);

    // 6. wait for complete
    await waitFor(() => args.completed);

    // 7. assert status history
    expect(statusHistory).toEqual([
      'walletScanned',
      'walletConnected',
      'appConnected',
      'walletApproved',
      'appApproved',
      'walletApproved',
      'appApproved',
      'completed',
    ]);

    client.off(args.sessionId);
  };

  test('should connect complete when everything is working: multiple step', async () => {
    let session: TestSession = {};

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    const args = { completed: false, sessionId };
    const statusHistory: string[] = [];
    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({ requestedClaims: [[profileRequest], [assetRequest]] });
      } else if (e.status === 'walletApproved') {
        if (e.currentStep === 0) {
          session = await updateSession({
            approveResults: [{ message: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` }],
          });
        }
        if (e.currentStep === 1) {
          session = await updateSession({
            approveResults: [
              // @ts-ignore
              ...session.approveResults,
              { message: `you provided asset ${(e.responseClaims[0] as TAssetResponse).asset}` },
            ],
          });
        }
      } else if (e.status === 'completed') {
        args.completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);

    await runMultiStepTest(authUrl, statusHistory, args);
  });

  test('should connect complete when everything is working: multiple step + pre-populated', async () => {
    let session: TestSession = {};

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    const statusHistory: string[] = [];
    const args = { completed: false, sessionId };
    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletApproved') {
        if (e.currentStep === 0) {
          session = await updateSession({
            approveResults: [{ message: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` }],
          });
        }
        if (e.currentStep === 1) {
          session = await updateSession({
            approveResults: [
              ...session.approveResults,
              { message: `you provided asset ${(e.responseClaims[0] as TAssetResponse).asset}` },
            ],
          });
        }
      } else if (e.status === 'completed') {
        args.completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest(
      {
        sessionId,
        updaterPk,
        authUrl,
        requestedClaims: [[profileRequest], [assetRequest]],
        timeout,
      },
      updater
    );
    expect(session.sessionId).toEqual(sessionId);

    await runMultiStepTest(authUrl, statusHistory, args);
  });

  test('should abort session when wallet rejected', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    const statusHistory: string[] = [];

    const { sessionId, updaterPk, authUrl } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      const nextUrl = getAuthUrl(authInfo.url);
      res = await api.post(nextUrl, {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          action: 'declineAuth',
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims).toBeFalsy();
    }

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'rejected']);

    client.off(sessionId);
  });

  test('should abort session when or challenge mismatch', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    const statusHistory: string[] = [];

    const { sessionId, updaterPk, authUrl } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      const nextUrl = getAuthUrl(authInfo.url);
      res = await api.post(nextUrl, {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: 'abcd',
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('error');
      expect(authInfo.errorMessage).toEqual('Challenge mismatch');
    }

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'error']);

    client.off(sessionId);
  });

  test('should abort session when error thrown on app connect', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};
    let completed = false;

    const statusHistory: string[] = [];
    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({
          status: 'error',
          error: 'You are not allowed to connect to this wallet',
        });
      } else if (e.status === 'completed') {
        completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toBe('error');
      expect(authInfo.response).toEqual({});
    }

    expect(completed).toBe(false);

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'error']);

    client.off(sessionId);
  });

  test('should abort session when error thrown on app approve', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};
    let completed = false;

    const statusHistory: string[] = [];
    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({ requestedClaims: [[profileRequest]] });
      } else if (e.status === 'walletApproved') {
        session = await updateSession({
          status: 'error',
          error: 'You are not allowed to connect to this wallet',
        });
      } else if (e.status === 'completed') {
        completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    let claims = authInfo.requestedClaims;
    let nextUrl = getAuthUrl(authUrl);
    let challenge = authInfo.challenge; // eslint-disable-line
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('profile');
      claims = authInfo.requestedClaims;
      challenge = authInfo.challenge;
      nextUrl = authInfo.url;
    }

    // 4. submit requested claims
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [{ type: 'profile', description: 'xxx', fullName: 'test', email: 'test@arcblock.io' }],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.response).toEqual({});
    expect(completed).toBe(false);

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'appConnected', 'walletApproved', 'error']);

    client.off(sessionId);
  });

  test('should timeout when client not connect properly', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    const statusHistory: string[] = [];
    const { sessionId, updaterPk, authUrl } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        // Do nothing to trigger timeout
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout: { ...timeout, app: 1000 } }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('error');
      expect(authInfo.errorMessage).toMatch('Requested claims not provided');
    }

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'timeout']);

    client.off(sessionId);
  });

  test('should timeout when api not connect properly', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    const statusHistory: string[] = [];
    const { sessionId, updaterPk, authUrl } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);
    });

    // 1. create session
    session = await doSignedRequest(
      {
        sessionId,
        updaterPk,
        authUrl,
        connectUrl: joinUrl(baseUrl, '/connect/error'),
        timeout: { ...timeout, app: 1000 },
      },
      updater
    );
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('error');
      expect(authInfo.errorMessage).toMatch('Failed to fetch request list from');
      expect(authInfo.errorMessage).toMatch('connect error');
    }

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'error']);

    client.off(sessionId);
  });

  test('should timeout when client not approve properly', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    const statusHistory: string[] = [];
    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({
          requestedClaims: [[profileRequest]],
        });
      } else if (e.status === 'walletApproved') {
        // Do nothing to trigger timeout
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout: { ...timeout, app: 1000 } }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    let claims = authInfo.requestedClaims;
    let nextUrl = getAuthUrl(authUrl);
    let challenge = authInfo.challenge; // eslint-disable-line
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('profile');
      claims = authInfo.requestedClaims;
      challenge = authInfo.challenge;
      nextUrl = authInfo.url;
    }

    // 4. submit requested claims
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [{ type: 'profile', description: 'xx', fullName: 'test', email: 'test@arcblock.io' }],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toMatch('Response claims not handled');

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'appConnected', 'walletApproved', 'timeout']);

    client.off(sessionId);
  });

  test('should timeout when api not approve properly', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    const statusHistory: string[] = [];
    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({
          requestedClaims: [[profileRequest]],
        });
      }
    });

    // 1. create session
    session = await doSignedRequest(
      {
        sessionId,
        updaterPk,
        authUrl,
        approveUrl: joinUrl(baseUrl, '/approve/notfound'),
        timeout: { ...timeout, app: 1000 },
      },
      updater
    );
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    let claims = authInfo.requestedClaims;
    let nextUrl = getAuthUrl(authUrl);
    let challenge = authInfo.challenge; // eslint-disable-line
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('profile');
      claims = authInfo.requestedClaims;
      challenge = authInfo.challenge;
      nextUrl = authInfo.url;
    }

    // 4. submit requested claims
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [{ type: 'profile', description: 'xx', fullName: 'test', email: 'test@arcblock.io' }],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toMatch('Failed to fetch approve result from');

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'appConnected', 'walletApproved', 'error']);

    client.off(sessionId);
  });

  test('should timeout when client not approve: multiple step', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    const statusHistory: string[] = [];

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({ requestedClaims: [[profileRequest], [assetRequest]] });
      } else if (e.status === 'walletApproved') {
        if (e.currentStep === 0) {
          session = await updateSession({
            approveResults: [{ message: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` }],
          });
        }
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout: { ...timeout, app: 1000 } }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    let claims = authInfo.requestedClaims;
    let nextUrl = getAuthUrl(authUrl);
    let challenge = authInfo.challenge; // eslint-disable-line
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('profile');
      claims = authInfo.requestedClaims;
      challenge = authInfo.challenge;
      nextUrl = authInfo.url;
    }

    // 4. submit profile claim
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [profileResponse],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('asset');
    claims = authInfo.requestedClaims;
    challenge = authInfo.challenge;
    nextUrl = authInfo.url;

    // 4. submit asset claim
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [assetResponse],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toMatch('Response claims not handled');

    // 7. assert status history
    expect(statusHistory).toEqual([
      'walletScanned',
      'walletConnected',
      'appConnected',
      'walletApproved',
      'appApproved',
      'walletApproved',
      'timeout',
    ]);

    client.off(sessionId);
  });

  test('should abort session when response claim mismatch', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};
    let completed = false;

    const statusHistory: string[] = [];
    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({ requestedClaims: [[profileRequest]] });
      } else if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [{ message: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` }],
        });
      } else if (e.status === 'completed') {
        completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    let claims = authInfo.requestedClaims;
    let nextUrl = getAuthUrl(authUrl);
    let challenge = authInfo.challenge; // eslint-disable-line
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('profile');
      claims = authInfo.requestedClaims;
      challenge = authInfo.challenge;
      nextUrl = authInfo.url;
    }

    // 4. submit requested claims
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [assetResponse],
        challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toMatch('do not match with requested claims');
    expect(completed).toBe(false);

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'appConnected', 'error']);
    client.off(sessionId);
  });

  test('should abort session when session canceled', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    const statusHistory: string[] = [];
    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({
          status: 'canceled',
        });
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      // @ts-ignore
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('error');
      expect(authInfo.errorMessage).toMatch('canceled');
    }

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'canceled']);

    client.off(sessionId);
  });

  test('should complete session when in onlyConnect mode', async () => {
    let session: TestSession = {};
    let res: any = {};
    // @ts-ignore
    let authInfo: TAuthResponse = {};

    const statusHistory: string[] = [];
    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e: RelayEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [
            { successMessage: `you connected account ${(e.responseClaims[0] as TAuthPrincipalResponse).userDid}` },
          ],
        });
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout, onlyConnect: true }, updater);
    expect(session.sessionId).toEqual(sessionId);
    expect(session.onlyConnect).toEqual(true);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect((authInfo.requestedClaims[0] as TAuthPrincipalRequest).supervised).toEqual(true);
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    res = await api.post(getAuthUrl(authInfo.url), {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [],
        challenge: authInfo.challenge,
      }),
    });
    // @ts-ignore
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('ok');
    expect(authInfo.successMessage).toMatch('you connected account');

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'walletApproved', 'appApproved', 'completed']);
    client.off(sessionId);
  });

  const prepareEvilTest = async () => {
    let session: TestSession = {};

    const { sessionId, updaterPk, authUrl, updateSession, deleteSession } = prepareTest();

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);
    expect(session.updaterPk).toEqual(updaterPk);
    expect(session.strategy).toEqual('default');
    expect(session.status).toEqual('created');

    return { sessionId, updaterPk, authUrl, updateSession, deleteSession };
  };

  test('should throw onUpdate when updater mismatch', async () => {
    const { updateSession } = await prepareEvilTest();
    const res = await updateSession({ status: 'error' }, evil);
    expect(res.code).toMatch('UPDATER_MISMATCH');
  });

  test('should throw onDelete when updater mismatch', async () => {
    const { deleteSession } = await prepareEvilTest();
    const res = await deleteSession(evil);
    expect(res.code).toMatch('UPDATER_MISMATCH');
  });

  test.skip('should not throw onDelete when updater match', async () => {
    const { deleteSession } = prepareTest();
    const res = await deleteSession();
    expect(res.error).toMatch('OK');
  });

  test('should throw onUpdate when status not valid', async () => {
    const { updateSession } = await prepareEvilTest();
    const res = await updateSession({ status: 'xxxx' });
    expect(res.error).toMatch('Can only update session status');
  });

  test('should throw onUpdate when requestedClaims not valid', async () => {
    const { updateSession } = await prepareEvilTest();
    const res = await updateSession({ requestedClaims: [[{ type: 'b' }]] });
    expect(res.error).toMatch('Invalid b request');
  });

  test('should throw onUpdate when error not valid', async () => {
    const { updateSession } = await prepareEvilTest();
    const res = await updateSession({ status: 'error' }, updater, '');
    expect(res.code).toMatch('UPDATER_PK_EMPTY');
  });

  test('should throw onUpdate when token not valid', async () => {
    const { updateSession } = await prepareEvilTest();
    const res = await updateSession({ status: 'error' }, updater, undefined, '');
    expect(res.code).toMatch('SIGNATURE_EMPTY');
  });

  test('should throw onUpdate when signature not valid', async () => {
    const { updateSession } = await prepareEvilTest();
    const res = await updateSession({ status: 'error' }, updater, 'abc', 'def');
    expect(res.code).toMatch('SIGNATURE_INVALID');
  });

  test('should throw onUpdate when hash not valid', async () => {
    const { updateSession } = await prepareEvilTest();
    const res = await updateSession({ status: 'error' }, updater, undefined, undefined, 'abc');
    expect(res.code).toMatch('PAYLOAD_HASH_MISMATCH');
  });

  test('should now throw onUpdate when update to error', async () => {
    const { updateSession } = await prepareEvilTest();
    const session = await updateSession({ status: 'error' });
    expect(session.status).toMatch('error');
  });

  test('should throw onUpdate when requestedClaims not valid', async () => {
    const { sessionId, updaterPk, authUrl } = await prepareEvilTest();
    const res = await doSignedRequest(
      { sessionId, updaterPk, authUrl, requestedClaims: [{ type: 'unknown' }] },
      updater
    );
    expect(res.error).toMatch('Invalid request group');
  });

  test('should throw onUpdate when sessionId valid', async () => {
    const { updaterPk, authUrl } = await prepareEvilTest();
    const res = await doSignedRequest({ sessionId: 'abc', updaterPk, authUrl }, updater);
    expect(res.error).toMatch('Invalid sessionId');
  });

  afterAll(async () => {
    // CAUTION: socket client disconnect should be called before server shutdown
    client.disconnect();
    await server.close();
  });
});
