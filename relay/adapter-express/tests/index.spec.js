/* eslint-disable import/no-extraneous-dependencies */
const axios = require('axios');
const Jwt = require('@arcblock/jwt');
const { nanoid } = require('nanoid');
const { WsClient } = require('@arcblock/ws');
const { fromRandom } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');
const objectHash = require('object-hash');
const waitFor = require('p-wait-for');
const joinUrl = require('url-join');
const { types } = require('@ocap/mcrypto');
const { MemoryStorage } = require('@did-connect/storage-memory');
const { Authenticator } = require('@did-connect/authenticator');
const { createHandlers } = require('@did-connect/handler');

const createTestServer = require('../../../scripts/create-test-server');
const { attachHandlers } = require('../lib');

const noop = () => null;
const user = fromRandom();
const updater = fromRandom();
const app = fromRandom({ role: types.RoleType.ROLE_APPLICATION });

const chainInfo = {
  host: 'https://beta.abtnetwork.io/api',
  id: 'beta',
};

const appInfo = ({ baseUrl }) => ({
  name: 'DID Wallet Demo',
  description: 'Demo application to show the potential of DID Wallet',
  icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
  link: baseUrl,
  updateSubEndpoint: true,
  subscriptionEndpoint: '/api/websocket',
  nodeDid: 'z1Zg7PUWJX2NS9cRhpjuMtvjjLK5W2E3Wsh',
});

describe('RelayAdapterExpress', () => {
  let server;
  let api;
  let client;
  let baseUrl;

  // eslint-disable-next-line consistent-return
  const doSignedRequest = async (data, wallet, url = '/api/connect/relay/session', method = 'POST') => {
    const headers = {};
    headers['x-updater-pk'] = wallet.publicKey;
    headers['x-updater-token'] = Jwt.sign(wallet.address, wallet.secretKey, { hash: objectHash(data) });
    headers['x-connected-did'] = user.address;
    headers['x-connected-pk'] = user.publicKey;

    const res = await api({ method, url, data, headers });
    return res.data;
  };

  const getWsClient = async (endpoint) => {
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

      client.onError((err) => {
        reject(new Error(`Failed to connect to daemon socket server: ${err.message}`));
      });

      client.connect();
    });
  };

  beforeAll(async () => {
    server = await createTestServer();

    const storage = new MemoryStorage();
    const authenticator = new Authenticator({ wallet: app, appInfo, chainInfo });
    // eslint-disable-next-line no-console
    const logger = { info: console.info, error: console.error, warn: console.warn, debug: noop };
    const handlers = createHandlers({ storage, authenticator, logger, timeout: 1000 });

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
    const updateSession = (updates) =>
      doSignedRequest(updates, updater, `/api/connect/relay/session?sid=${sessionId}`, 'PUT');
    return { sessionId, updaterPk, authUrl, updateSession };
  };

  const getAuthUrl = (authUrl) => {
    const obj = new URL(authUrl);
    obj.searchParams.set('user-agent', 'ArcWallet/3.0.0');
    return obj.href;
  };

  test('should throw on invalid session', async () => {
    let res = null;

    const { sessionId, updaterPk, authUrl } = prepareTest();

    res = await doSignedRequest({ sessionId: 'abc', updaterPk, authUrl }, updater);
    expect(res.error).toMatch('Invalid sessionId');

    res = await doSignedRequest({ sessionId, updaterPk: '', authUrl }, updater);
    expect(res.error).toMatch('updaterPk');

    try {
      await api.get(`/api/connect/relay/session?sid=${nanoid()}`);
    } catch (err) {
      expect(err.response.data.error).toMatch('not found');
    }

    try {
      await api.get('/api/connect/relay/session');
    } catch (err) {
      expect(err.response.data.error).toMatch('No sessionId');
    }

    try {
      await api.get('/api/connect/relay/session?sid=abc');
    } catch (err) {
      expect(err.response.data.error).toMatch('Invalid sessionId');
    }
  });

  test('should connect complete when everything is working: single', async () => {
    let session = null;
    let res = null;
    let authInfo = null;
    let completed = false;

    const statusHistory = [];

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e) => {
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({
          requestedClaims: [
            {
              type: 'profile',
              fields: ['fullName', 'email', 'avatar'],
              description: 'Please give me your profile',
            },
          ],
        });
      } else if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [`you provided profile ${e.responseClaims[0].fullName}`],
        });
      } else if (e.status === 'completed') {
        completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl }, updater);
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
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
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
      userInfo: Jwt.sign(user.address, user.secretKey, {
        requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
        challenge,
      }),
    });
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('ok');
    expect(authInfo.response.message).toMatch(/profile test/);

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
  });

  test('should connect complete when everything is working: multiple step', async () => {
    let session = null;
    let res = null;
    let authInfo = null;
    let completed = false;

    const statusHistory = [];

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    client.on(sessionId, async (e) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        session = await updateSession({
          requestedClaims: [
            {
              type: 'profile',
              fields: ['fullName', 'email', 'avatar'],
              description: 'Please give me your profile',
            },
            {
              type: 'asset',
              description: 'Please prove that you own asset',
              target: user.address,
            },
          ],
        });
      } else if (e.status === 'walletApproved') {
        if (e.currentStep === 0) {
          session = await updateSession({
            approveResults: [`you provided profile ${e.responseClaims[0].fullName}`],
          });
        }
        if (e.currentStep === 1) {
          session = await updateSession({
            approveResults: [...session.approveResults, `you provided asset ${e.responseClaims[0].address}`],
          });
        }
      } else if (e.status === 'completed') {
        completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl }, updater);
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
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
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
      userInfo: Jwt.sign(user.address, user.secretKey, {
        requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
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
      Jwt.sign(user.address, user.secretKey, {
        requestedClaims: [{ type: 'asset', address: user.address }],
        challenge,
      })
    );

    res = await api.get(obj.href);
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('ok');
    expect(authInfo.response.message).toMatch(/you provided asset/);

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
