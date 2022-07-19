/* eslint-disable import/no-relative-packages */
/* eslint-disable import/no-extraneous-dependencies */
import type {
  TSession,
  TEvent,
  TAnyObject,
  TAnyRequest,
  TProfileRequest,
  TProfileResponse,
  TAssetRequest,
  TAssetResponse,
} from '@did-connect/types';

import axios from 'axios';
import { sign, verify, decode } from '@arcblock/jwt';
import { nanoid } from 'nanoid';
// @ts-ignore
import { WsClient } from '@arcblock/ws';
import { fromRandom, WalletObject } from '@ocap/wallet';
import { toBase58 } from '@ocap/util';
// @ts-ignore
import objectHash from 'object-hash';
import waitFor from 'p-wait-for';
// @ts-ignore
import joinUrl from 'url-join';
import { types } from '@ocap/mcrypto';
import { MemoryStorage } from '@did-connect/storage-memory';
import { Authenticator } from '@did-connect/authenticator';
import { createHandlers } from '@did-connect/handler';
import { SessionTimeout } from '@did-connect/types';

// @ts-ignore
import createTestServer from '../../../scripts/create-test-server';

import { attachHandlers } from '../src/index';

const Jwt = { sign, verify, decode };
const noop = () => null;
const timeout = SessionTimeout;
const user = fromRandom();
const updater = fromRandom();
const app = fromRandom({ role: types.RoleType.ROLE_APPLICATION });

const chainInfo = {
  host: 'https://beta.abtnetwork.io/api',
  id: 'beta',
};

const appInfo = ({ baseUrl }: TAnyObject) => ({
  name: 'DID Wallet Demo',
  description: 'Demo application to show the potential of DID Wallet',
  icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
  link: baseUrl,
  updateSubEndpoint: true,
  subscriptionEndpoint: '/api/websocket',
  nodeDid: 'z1Zg7PUWJX2NS9cRhpjuMtvjjLK5W2E3Wsh',
});

const profileRequest: TProfileRequest = {
  type: 'profile',
  items: ['fullName', 'email', 'avatar'],
  description: 'Please give me your profile',
};
const profileResponse: TProfileResponse = {
  type: 'profile',
  fullName: 'test',
  email: 'test@arcblock.io',
  avatar: 'abc',
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

describe('RelayAdapterExpress', () => {
  let server: any;
  let api: any;
  let client: any;
  let baseUrl: string;

  // eslint-disable-next-line consistent-return
  const doSignedRequest = async (
    data: any,
    wallet: WalletObject,
    url: string = '/api/connect/relay/session',
    method: string = 'POST'
  ): Promise<any> => {
    const headers: TAnyObject = {};
    headers['x-updater-pk'] = wallet.publicKey;
    headers['x-updater-token'] = Jwt.sign(wallet.address, wallet.secretKey as string, { hash: objectHash(data) });
    headers['x-connected-did'] = user.address;
    headers['x-connected-pk'] = user.publicKey;

    const res = await api({ method, url, data, headers });
    return res.data;
  };

  const getWsClient = async (endpoint: string) => {
    if (!client) {
      client = new WsClient(`${endpoint}/api/connect/relay`, { heartbeatIntervalMs: 10 * 1000 });

      process.on('exit', () => {
        client.disconnect();
      });
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
    server = await createTestServer();

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
    const updateSession = (updates: Partial<TSession>) =>
      doSignedRequest(updates, updater, `/api/connect/relay/session?sid=${sessionId}`, 'PUT');
    const deleteSession = () => doSignedRequest({}, updater, `/api/connect/relay/session?sid=${sessionId}`, 'DELETE');
    return { sessionId, updaterPk, authUrl, updateSession, deleteSession };
  };

  const getAuthUrl = (authUrl: string) => {
    const obj = new URL(authUrl);
    obj.searchParams.set('user-agent', 'ArcWallet/3.0.0');
    return obj.href;
  };

  test('should throw on invalid session', async () => {
    let res: any = null;

    const { sessionId, updaterPk, authUrl } = prepareTest();

    res = await doSignedRequest({ sessionId: 'abc', updaterPk, authUrl, timeout }, updater);
    expect(res.error).toMatch('Invalid sessionId');

    res = await doSignedRequest({ sessionId, updaterPk: '', authUrl, timeout }, updater);
    expect(res.error).toMatch('updaterPk');

    try {
      await api.get(`/api/connect/relay/session?sid=${nanoid()}`);
    } catch (err: any) {
      expect(err.response.data.error).toMatch('not found');
    }

    try {
      await api.get('/api/connect/relay/session');
    } catch (err: any) {
      expect(err.response.data.error).toMatch('No sessionId');
    }

    try {
      await api.get('/api/connect/relay/session?sid=abc');
    } catch (err: any) {
      expect(err.response.data.error).toMatch('Invalid sessionId');
    }
  });

  test('should connect complete when everything is working: single', async () => {
    // @ts-ignore
    let session: TSession = null;
    let res: any = null;
    let authInfo: any = null;
    let completed = false;

    const statusHistory: string[] = [];

    const { sessionId, updaterPk, authUrl, updateSession, deleteSession } = prepareTest();

    client.on(sessionId, async (e: TEvent) => {
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({
          requestedClaims: [[profileRequest]],
        });
      } else if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [
            { successMessage: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` },
          ],
        });
      } else if (e.status === 'completed') {
        completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);
    expect(session.updaterPk).toEqual(updaterPk);
    expect(session.strategy).toEqual('default');

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    let claims = authInfo.requestedClaims;
    let nextUrl = getAuthUrl(authUrl);
    let challenge = authInfo.challenge; // eslint-disable-line
    if (claims.find((x: TAnyRequest) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
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
        requestedClaims: [profileResponse],
        challenge,
      }),
    });
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('ok');
    expect(authInfo.successMessage).toMatch(/profile test/);

    // 6. wait for complete
    await waitFor(() => completed);

    // 7. assert status history
    expect(statusHistory).toEqual([
      'walletScanned',
      'walletConnected',
      'appConnected',
      'walletApproved',
      'appApproved',
      'completed',
    ]);

    client.off(sessionId);

    res = await api.get(`/api/connect/relay/session?sid=${sessionId}`);
    expect(res.data.sessionId).toEqual(sessionId);

    res = await deleteSession();
    expect(res.code).toBe('OK');
  });

  test('should connect complete when everything is working: multiple step', async () => {
    // @ts-ignore
    let session: TSession = null;
    let res: any = null;
    let authInfo: any = null;
    let completed = false;

    const statusHistory: string[] = [];

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e: TEvent) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({
          requestedClaims: [[profileRequest], [assetRequest]],
        });
      } else if (e.status === 'walletApproved') {
        if (e.currentStep === 0) {
          session = await updateSession({
            approveResults: [
              { successMessage: `you provided profile ${(e.responseClaims[0] as TProfileResponse).fullName}` },
            ],
          });
        }
        if (e.currentStep === 1) {
          session = await updateSession({
            approveResults: [
              ...session.approveResults,
              { successMessage: `you provided asset ${(e.responseClaims[0] as TAssetResponse).asset}` },
            ],
          });
        }
      } else if (e.status === 'completed') {
        completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl, timeout }, updater);
    expect(session.sessionId).toEqual(sessionId);
    expect(session.updaterPk).toEqual(updaterPk);
    expect(session.strategy).toEqual('default');

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    let claims = authInfo.requestedClaims;
    let nextUrl = getAuthUrl(authUrl);
    let challenge = authInfo.challenge; // eslint-disable-line
    if (claims.find((x: TAnyRequest) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
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
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('asset');
    claims = authInfo.requestedClaims;
    challenge = authInfo.challenge;
    nextUrl = authInfo.url;

    // 4. submit asset claim
    const obj = new URL(nextUrl);
    obj.pathname += '/submit';
    obj.searchParams.set('userPk', toBase58(user.publicKey));
    obj.searchParams.set(
      'userInfo',
      Jwt.sign(user.address, user.secretKey as string, {
        requestedClaims: [assetResponse],
        challenge,
      })
    );

    res = await api.get(obj.href);
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('ok');
    expect(authInfo.successMessage).toMatch(/you provided asset/);

    // 6. wait for complete
    await waitFor(() => completed);

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

    client.off(sessionId);
  });

  afterAll(async () => {
    // CAUTION: socket client disconnect should be called before server shutdown
    client.disconnect();
    await server.close();
  });
});
