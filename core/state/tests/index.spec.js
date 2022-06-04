/* eslint-disable import/no-extraneous-dependencies */
const { types } = require('@ocap/mcrypto');
const { fromRandom } = require('@ocap/wallet');
const { interpret } = require('xstate');
const axios = require('axios');
const Jwt = require('@arcblock/jwt');
const { toBase58 } = require('@ocap/util');
const waitFor = require('p-wait-for');
const joinUrl = require('url-join');

const MemoryStorage = require('@did-connect/storage-memory');
const Authenticator = require('@did-connect/authenticator');
const createHandlers = require('@did-connect/handler');
const attachHandlers = require('@did-connect/relay-adapter-express');

const createTestServer = require('../../../scripts/create-test-server');
const { createMachine, destroyConnections } = require('..');

const noop = () => null;
const user = fromRandom();
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

const getAuthUrl = (authUrl) => {
  const obj = new URL(authUrl);
  obj.searchParams.set('user-agent', 'ArcWallet/3.0.0');
  return obj.href;
};

describe('RelayAdapterExpress', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = await createTestServer();

    const storage = new MemoryStorage();
    const authenticator = new Authenticator({ wallet: app, appInfo, chainInfo });
    // eslint-disable-next-line no-console
    const logger = { info: console.info, error: console.info, warn: console.warn, debug: noop };
    const handlers = createHandlers({ storage, authenticator, logger, timeout: 1000 });
    handlers.wsServer.attach(server.http);
    handlers.wsServer.attach(server.https);

    attachHandlers(server, handlers);

    baseUrl = server.url;
  });

  test('should work as expected: single', async () => {
    let res;
    let authInfo;

    const machine = createMachine({
      baseUrl: joinUrl(baseUrl, '/api/connect/relay'),
      onConnect: (...args) => {
        console.log('onConnect', args);
        return [
          {
            type: 'profile',
            fields: ['fullName', 'email', 'avatar'],
            description: 'Please give me your profile',
          },
        ];
      },
      onApprove: (...args) => {
        console.log('onApprove', args);
        return 'approve result';
      },
      dispatch: (...args) => service.send.call(service, ...args),
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => console.log('transition', state.value, state.context));

    // Start the service
    service.start();

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${initial.context.sessionId}`);
    console.log(authUrl);

    // 2. simulate scan
    try {
      res = await axios.get(getAuthUrl(authUrl));
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

      res = await axios.post(nextUrl, {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
          challenge,
        }),
      });
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('ok');
    } catch (err) {
      console.error(err);
    }

    return new Promise((resolve) => setTimeout(resolve, 10000));
  }, 60000);

  afterAll(async () => {
    // CAUTION: socket client disconnect should be called before server shutdown
    destroyConnections();
    await server.close();
  });
});
