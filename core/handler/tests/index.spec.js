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
const attachHandlers = require('@did-connect/relay-adapter-express');
const createTestServer = require('../../../scripts/create-test-server');
const createHandlers = require('..');

const noop = () => null;
const user = fromRandom();
const updater = fromRandom();
const evil = fromRandom();
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

  // eslint-disable-next-line consistent-return
  const doSignedRequest = async (
    data,
    wallet,
    url = '/api/connect/relay/session',
    method = 'POST',
    pk = undefined,
    token = undefined,
    hash = undefined
  ) => {
    const headers = {};
    headers['x-updater-pk'] = typeof pk === 'undefined' ? wallet.publicKey : pk;
    headers['x-updater-token'] =
      typeof token === 'undefined'
        ? Jwt.sign(wallet.address, wallet.secretKey, { hash: typeof hash === 'undefined' ? objectHash(data) : hash })
        : token;

    const res = await api({ method, url, data, headers });
    return res.data;
  };

  const getWsClient = async (endpoint) => {
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
    const logger = { info: noop, error: noop, warn: console.warn, debug: noop };
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
    const updateSession = (updates, wallet = updater, pk = undefined, token = undefined, hash = undefined) =>
      doSignedRequest(updates, wallet, `/api/connect/relay/session?sid=${sessionId}`, 'PUT', pk, token, hash);
    const getSession = () => api.get(`/api/connect/relay/session?sid=${sessionId}`).then((x) => x.data);

    return { sessionId, updaterPk, authUrl, updateSession, getSession };
  };

  const getAuthUrl = (authUrl) => {
    const obj = new URL(authUrl);
    obj.searchParams.set('user-agent', 'ArcWallet/3.0.0');
    return obj.href;
  };

  const runSingleTest = async (authUrl, statusHistory, args) => {
    let res = null;
    let authInfo = null;

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
    expect(authInfo.response).toMatch(/profile test/);

    // 6. wait for complete
    await waitFor(() => args.completed);

    // 7. try to submit to a finalized session
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey, {
        requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
        challenge,
      }),
    });
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
    let session = null;

    const { sessionId, updaterPk, authUrl, updateSession, getSession } = prepareTest();
    const args = { completed: false, sessionId };
    const statusHistory = [];
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
          approveResults: [`you provided profile ${e.responseClaims[0].fullName}`],
        });
      } else if (e.status === 'completed') {
        args.completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl }, updater);
    expect(session.sessionId).toEqual(sessionId);

    await runSingleTest(authUrl, statusHistory, args);

    // assert session completed
    session = await getSession();
    expect(session.status).toEqual('error');

    // try to scan a finalized session
    const res = await api.get(getAuthUrl(authUrl));
    const authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toEqual('Session finalized');
  });

  test('should connect complete when everything is working: single + prepopulated', async () => {
    let session = null;

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    const args = { completed: false, sessionId };
    const statusHistory = [];
    client.on(sessionId, async (e) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletApproved') {
        session = await updateSession({
          approveResults: [`you provided profile ${e.responseClaims[0].fullName}`],
        });
      }
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
        requestedClaims: [
          {
            type: 'profile',
            fields: ['fullName', 'email', 'avatar'],
            description: 'Please give me your profile',
          },
        ],
      },
      updater
    );
    expect(session.sessionId).toEqual(sessionId);

    await runSingleTest(authUrl, statusHistory, args);
  });

  const runMultiStepTest = async (authUrl, statusHistory, args) => {
    let res = null;
    let authInfo = null;

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
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey, {
        requestedClaims: [{ type: 'asset', address: user.address }],
        challenge,
      }),
    });
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.status).toEqual('ok');
    expect(authInfo.response).toMatch(/you provided asset/);

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
    let session = null;

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    const args = { completed: false, sessionId };
    const statusHistory = [];
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
        args.completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl }, updater);
    expect(session.sessionId).toEqual(sessionId);

    await runMultiStepTest(authUrl, statusHistory, args);
  });

  test('should connect complete when everything is working: multiple step + prepopulated', async () => {
    let session = null;

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    const statusHistory = [];
    const args = { completed: false, sessionId };
    client.on(sessionId, async (e) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);

      if (e.status === 'walletApproved') {
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
        args.completed = true;
      }
    });

    // 1. create session
    session = await doSignedRequest(
      {
        sessionId,
        updaterPk,
        authUrl,
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
      },
      updater
    );
    expect(session.sessionId).toEqual(sessionId);

    await runMultiStepTest(authUrl, statusHistory, args);
  });

  test('should abort session when wallet rejected', async () => {
    let session = null;
    let res = null;
    let authInfo = null;

    const statusHistory = [];

    const { sessionId, updaterPk, authUrl } = prepareTest();

    client.on(sessionId, async (e) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      const nextUrl = getAuthUrl(authInfo.url);
      res = await api.post(nextUrl, {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          action: 'declineAuth',
          requestedClaims: [],
          challenge: authInfo.challenge,
        }),
      });
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims).toBeFalsy();
    }

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'rejected']);

    client.off(sessionId);
  });

  test('should abort session when or challenge mismatch', async () => {
    let session = null;
    let res = null;
    let authInfo = null;

    const statusHistory = [];

    const { sessionId, updaterPk, authUrl } = prepareTest();

    client.on(sessionId, async (e) => {
      expect(e.status).toBeTruthy();
      statusHistory.push(e.status);
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl }, updater);
    expect(session.sessionId).toEqual(sessionId);

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      const nextUrl = getAuthUrl(authInfo.url);
      res = await api.post(nextUrl, {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [],
          challenge: 'abcd',
        }),
      });
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('error');
      expect(authInfo.errorMessage).toEqual('Challenge mismatch');
    }

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'error']);

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

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
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

    // 2. simulate scan
    res = await api.get(getAuthUrl(authUrl));
    expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
    authInfo = Jwt.decode(res.data.authInfo);
    expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
    expect(authInfo.url).toEqual(authUrl);

    // 3. submit auth principal
    const claims = authInfo.requestedClaims;
    if (claims.find((x) => x.type === 'authPrincipal')) {
      res = await api.post(getAuthUrl(authInfo.url), {
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
    expect(authInfo.status).toEqual('error');
    expect(authInfo.errorMessage).toMatch('Response claims not handled');

    // 7. assert status history
    expect(statusHistory).toEqual(['walletScanned', 'walletConnected', 'appConnected', 'walletApproved', 'timeout']);

    client.off(sessionId);
  });

  test('should timeout when client not approve: multiple step', async () => {
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
      }
    });

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl }, updater);
    expect(session.sessionId).toEqual(sessionId);

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
    res = await api.post(nextUrl, {
      userPk: toBase58(user.publicKey),
      userInfo: Jwt.sign(user.address, user.secretKey, {
        requestedClaims: [{ type: 'asset', address: user.address }],
        challenge,
      }),
    });
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

  test('should session create/update work and throw as expected', async () => {
    let session = null;
    let res = null;

    const { sessionId, updaterPk, authUrl, updateSession } = prepareTest();

    // 1. create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl }, updater);
    expect(session.sessionId).toEqual(sessionId);
    expect(session.updaterPk).toEqual(updaterPk);
    expect(session.strategy).toEqual('default');
    expect(session.status).toEqual('created');

    // 2. signature
    res = await updateSession({ status: 'error' }, evil);
    expect(res.error).toEqual('Invalid updater');

    res = await updateSession({ status: 'xxxx' });
    expect(res.error).toEqual('Invalid session status');

    res = await updateSession({ requestedClaims: [{ a: 'b' }] });
    expect(res.error).toMatch('Invalid session');
    expect(res.error).toMatch('requestedClaims');

    res = await updateSession({ status: 'error' }, updater, '');
    expect(res.error).toEqual('Invalid updater pk');

    res = await updateSession({ status: 'error' }, updater, undefined, '');
    expect(res.error).toEqual('Invalid token');

    res = await updateSession({ status: 'error' }, updater, 'abc', 'def');
    expect(res.error).toEqual('Invalid updater signature');

    res = await updateSession({ status: 'error' }, updater, undefined, undefined, 'abc');
    expect(res.error).toEqual('Invalid payload hash');

    session = await updateSession({ status: 'error' });
    expect(session.status).toEqual('error');

    res = await updateSession({ status: 'error' });
    expect(res.error).toEqual('Session finalized');

    // 3. invalid session
    res = await doSignedRequest({ sessionId, updaterPk, authUrl, requestedClaims: [{ type: 'unknown' }] }, updater);
    expect(res.error).toMatch('Invalid session');
    expect(res.error).toMatch('requestedClaims');

    // 4. invalid sessionId
    res = await doSignedRequest({ sessionId: 'abc', updaterPk, authUrl }, updater);
    expect(res.error).toMatch('Invalid sessionId');
  });

  afterAll(async () => {
    // CAUTION: socket client disconnect should be called before server shutdown
    client.disconnect();
    await server.close();
  });
});
