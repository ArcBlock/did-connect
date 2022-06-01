/* eslint-disable import/no-extraneous-dependencies */
const uuid = require('uuid');
const axios = require('axios');
const Jwt = require('@arcblock/jwt');
const { WsClient } = require('@arcblock/ws');
const { fromRandom } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');
const objectHash = require('object-hash');
const joinUrl = require('url-join');
const Mcrypto = require('@ocap/mcrypto');
const MemoryStorage = require('@did-connect/storage-memory');

const Authenticator = require('@did-connect/authenticator');
const { createHandlers } = require('@did-connect/handler');
const createTestServer = require('../../../scripts/create-test-server');
const attachHandlers = require('..');

// const user = fromRandom();
const updater = fromRandom();
const app = fromRandom({ role: Mcrypto.types.RoleType.ROLE_APPLICATION });
// const headers = {
//   'User-Agent': 'ArcWallet/1.3.29 iPhone12,3 iOS/13.0 CFNetwork/1098.7 Darwin/19.0.0',
// };

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
      console.info('doSignedRequest.error', err.message, err.response.data);
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
    const handlers = createHandlers({ storage, authenticator });

    handlers.wsServer.attach(server.http);
    handlers.wsServer.attach(server.https);

    attachHandlers(server, handlers);

    baseUrl = server.url;
    api = axios.create({ baseURL: server.url });
    client = await getWsClient(baseUrl.replace('http:', 'ws:'));
  });

  test('should connect workflow work as expected', async () => {
    let session = null;
    let obj = null;
    let res = null;

    const sessionId = uuid.v4();
    const updaterPk = updater.publicKey;

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${sessionId}`);
    const updateSession = (updates) =>
      doSignedRequest(updates, updater, `/api/connect/relay/session?sid=${sessionId}`, 'PUT');

    client.on(sessionId, async (e) => {
      if (e.status === 'walletConnected') {
        console.log('connected', e);
        session = await updateSession({
          requestedClaims: [
            {
              type: 'profile',
              fields: ['fullName', 'email', 'avatar'],
              description: 'Please give me your profile',
            },
          ],
          // status: 'error',
          // error: 'You are not allowed to connect to this wallet',
        });
      } else if (e.status === 'walletApproved') {
        console.log('approved', e);
        session = await updateSession({
          approveResults: [`you provided profile ${e.claims[0].fullName}`],
          // status: 'error',
          // error: 'You are not allowed to connect to this wallet',
        });
      } else {
        console.log('event', e);
      }
    });

    // create session
    session = await doSignedRequest({ sessionId, updaterPk, authUrl }, updater);
    console.log('created', session);
  });

  afterAll(async () => {
    await server.close();
  });
});
