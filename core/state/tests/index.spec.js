/* eslint-disable import/no-extraneous-dependencies */
const { types } = require('@ocap/mcrypto');
const { fromRandom } = require('@ocap/wallet');
const { interpret } = require('xstate');
const joinUrl = require('url-join');

const MemoryStorage = require('@did-connect/storage-memory');
const Authenticator = require('@did-connect/authenticator');
const createHandlers = require('@did-connect/handler');
const attachHandlers = require('@did-connect/relay-adapter-express');

const createTestServer = require('../../../scripts/create-test-server');
const { createMachine, destroyConnections } = require('..');

const noop = () => null;
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
  let baseUrl;

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
  });

  test('should work as expected: single', () => {
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

    const service = interpret(machine).onTransition((state) => console.log('transition', state.value));

    // Start the service
    service.start();
    // service.send({ type: 'RESOLVE' });

    return new Promise((resolve) => setTimeout(resolve, 60000));
  }, 60000);

  afterAll(async () => {
    // CAUTION: socket client disconnect should be called before server shutdown
    destroyConnections();
    await server.close();
  });
});
