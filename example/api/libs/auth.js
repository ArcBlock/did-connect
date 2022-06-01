const path = require('path');
const AuthStorage = require('@did-connect/storage-nedb');
const getWallet = require('@blocklet/sdk/lib/wallet');
const Authenticator = require('@blocklet/sdk/lib/wallet-authenticator');
const WalletHandler = require('@blocklet/sdk/lib/wallet-handler');
const Client = require('@ocap/client');

const env = require('./env');
const client = new Client(env.chainHost);

const wallet = getWallet();
const authenticator = new Authenticator();
const handlers = new WalletHandler({
  authenticator,
  sessionStorage: new AuthStorage({
    dbPath: path.join(env.dataDir, 'auth.db'),
  }),
});

module.exports = {
  authenticator,
  handlers,
  wallet,
  client,
};
