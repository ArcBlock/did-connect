/* eslint-disable import/no-extraneous-dependencies */
const uuid = require('uuid');
const axios = require('axios');
const Jwt = require('@arcblock/jwt');
const { WsClient } = require('@arcblock/ws');
const { fromRandom } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');
const objectHash = require('object-hash');
const waitFor = require('p-wait-for');
const joinUrl = require('url-join');
const Mcrypto = require('@ocap/mcrypto');
const MemoryStorage = require('@did-connect/storage-memory');

const Authenticator = require('@did-connect/authenticator');
const { createHandlers } = require('@did-connect/handler');
const createTestServer = require('../../../scripts/create-test-server');
const attachHandlers = require('..');

const user = fromRandom();
const updater = fromRandom();
const app = fromRandom({ role: Mcrypto.types.RoleType.ROLE_APPLICATION });

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

  const doSignedRequest = async (data, wallet, url = '/api/connect/relay/session', method = 'POST') => {
    const headers = {};
    headers['x-updater-pk'] = wallet.publicKey;
    headers['x-updater-token'] = Jwt.sign(wallet.address, wallet.secretKey, { hash: objectHash(data) });

    try {
      const res = await api({ method, url, data, headers });
      return res.data;
    } catch (err) {
      console.error('doSignedRequest.error', err.message, err.response.data);
    }
  };

  const getWsClient = async (endpoint) => {
    if (!client) {
      client = new WsClient(`${endpoint}/connect/relay`, { heartbeatIntervalMs: 10 * 1000 });

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
    const logger = { info: console.info, error: console.error, warn: console.warn, debug: () => {} };
    const handlers = createHandlers({ storage, authenticator, logger, timeout: 1000 });

    handlers.wsServer.attach(server.http);
    handlers.wsServer.attach(server.https);

    attachHandlers(server, handlers);

    baseUrl = server.url;
    api = axios.create({ baseURL: server.url });
    client = await getWsClient(baseUrl.replace('http:', 'ws:'));
  });

  const prepareTest = () => {
    const sessionId = uuid.v4();
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

  test('should connect complete when everything is working', async () => {
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
          ],
        });
      } else if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [`you provided profile ${e.claims[0].fullName}`],
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
      res = await axios.post(getAuthUrl(authInfo.url), {
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
    res = await axios.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey, {
        requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
        challenge,
      }),
    });
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('ok');
    expect(authInfo.response).toMatch(/profile test/);

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
  });

  test('should abort session when error thrown on app connect', async () => {
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
          status: 'error',
          error: 'You are not allowed to connect to this wallet',
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
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await axios.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
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
          ],
        });
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
      res = await axios.post(getAuthUrl(authInfo.url), {
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
    res = await axios.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey, {
        requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
        challenge,
      }),
    });
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.response).toEqual({});
    expect(completed).toBe(false);

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'appConnected', 'walletApproved', 'error']);

    client.off(sessionId);
  });

  test('should timeout when client not connect properly', async () => {
    let session = null;
    let res = null;
    let authInfo = null;

    const statusHistory = [];
    const { sessionId, updaterPk, authUrl } = prepareTest();

    client.on(sessionId, async (e) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletConnected') {
        // Do nothing to trigger timeout
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
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await axios.post(getAuthUrl(authInfo.url), {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('error');
      expect(authInfo.errorMessage).toMatch('Requested claims not provided');
    }

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'timeout']);

    client.off(sessionId);
  });

  test('should timeout when client not approve properly', async () => {
    let session = null;
    let res = null;
    let authInfo = null;

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
          ],
        });
      } else if (e.status === 'walletApproved') {
        // Do nothing to trigger timeout
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
      res = await axios.post(getAuthUrl(authInfo.url), {
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
    res = await axios.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey, {
        requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
        challenge,
      }),
    });
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toMatch('Response claims not handled');

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'appConnected', 'walletApproved', 'timeout']);

    client.off(sessionId);
  });

  afterAll(async () => {
    // CAUTION: socket client disconnect should be called before server shutdown
    client.disconnect();
    await server.close();
  });
});
