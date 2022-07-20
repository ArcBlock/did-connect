/* eslint-disable no-console */
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const express = require('express');
const env = require('@blocklet/sdk/lib/env');
const Authenticator = require('@blocklet/sdk/lib/connect/authenticator');
const createHandlers = require('@blocklet/sdk/lib/connect/handler');
const { NedbStorage } = require('@did-connect/storage-nedb');
const { attachHandlers } = require('@did-connect/relay-adapter-express');

const storage = new NedbStorage({ dbPath: path.join(env.dataDir, 'sessions.db'), ttl: 60 * 1000 });
const authenticator = new Authenticator({});

const noop = () => null;
const logger = { info: console.info, error: console.error, warn: console.warn, debug: noop };
const handlers = createHandlers({ storage, authenticator, logger });

const app = express();
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.post('/connect/profile', (req, res) => {
  res.jsonp([
    [
      {
        type: 'profile',
        items: ['fullName', 'email', 'avatar'],
        description: 'Please give me your profile',
      },
    ],
  ]);
});

app.post('/approve/profile', (req, res) => {
  const { responseClaims, currentStep } = req.body;
  res.jsonp({
    successMessage: `Your name is ${responseClaims[currentStep][0].fullName}`,
  });
});

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
