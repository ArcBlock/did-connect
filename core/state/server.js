/* eslint-disable import/no-extraneous-dependencies */
const joinUrl = require('url-join');
const { fromRandom } = require('@ocap/wallet');
const { types } = require('@ocap/mcrypto');
const MemoryStorage = require('@did-connect/storage-memory');

const Authenticator = require('@did-connect/authenticator');
const attachHandlers = require('@did-connect/relay-adapter-express');
const createHandlers = require('@did-connect/handler');

const createTestServer = require('../../scripts/create-test-server');
const { createConnection } = require('./lib/socket');
const { createSocketEndpoint } = require('./lib/util');

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
(async () => {
  const server = await createTestServer();
  const storage = new MemoryStorage();
  const authenticator = new Authenticator({ wallet: app, appInfo, chainInfo });

  // eslint-disable-next-line no-console
  const logger = { info: noop, error: noop, warn: console.warn, debug: noop };
  const handlers = createHandlers({ storage, authenticator, logger, timeout: 1000 });
  handlers.wsServer.attach(server.http);
  handlers.wsServer.attach(server.https);

  attachHandlers(server, handlers);

  const baseUrl = server.url;
  const endpoint = createSocketEndpoint(joinUrl(baseUrl, '/api/connect/relay')).replace('localhost', '127.0.0.1');
  const socket = await createConnection(endpoint);
  console.log({ baseUrl, endpoint });
})();
