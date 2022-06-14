/* eslint-disable no-console */
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const express = require('express');
const env = require('@blocklet/sdk/lib/env');
const getWallet = require('@blocklet/sdk/lib/wallet');
const SessionStorage = require('@did-connect/storage-nedb');
const Authenticator = require('@did-connect/authenticator');
const createHandlers = require('@did-connect/handler');
const attachHandlers = require('@did-connect/relay-adapter-express');

const storage = new SessionStorage({ dbPath: path.join(env.dataDir, 'sessions.db'), ttl: 60 * 1000 });
const authenticator = new Authenticator({
  wallet: getWallet(),
  appInfo: {
    name: env.appName,
    description: env.appDescription,
    icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
    link: env.appUrl,
    // FIXME: following props should be wrapped in @blocklet/sdk
    updateSubEndpoint: true,
    subscriptionEndpoint: '/api/websocket',
    nodeDid: process.env.ABT_NODE_DID,
  },
});

const noop = () => null;
const logger = { info: console.info, error: console.error, warn: console.warn, debug: noop };
const handlers = createHandlers({ storage, authenticator, logger, timeout: 20000 });

const app = express();
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

attachHandlers(app, handlers);

app.use((req, res) => {
  res.send('DID Connect Relay server is running');
});

const port = parseInt(process.env.BLOCKLET_PORT, 10) || 3000;
const server = app.listen(port, (err) => {
  if (err) throw err;
  console.log(`> DID Connect Relay server ready on ${port}`);
});

handlers.wsServer.attach(server);
