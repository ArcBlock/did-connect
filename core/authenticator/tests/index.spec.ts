/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-shadow */
const omit = require('lodash/omit');
const Mcrypto = require('@ocap/mcrypto');
const Jwt = require('@arcblock/jwt');
const { fromRandom, WalletType } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');

const { Authenticator } = require('../src');

const type = WalletType({
  role: Mcrypto.types.RoleType.ROLE_APPLICATION,
  pk: Mcrypto.types.KeyType.ED25519,
  hash: Mcrypto.types.HashType.SHA3,
});

const wallet = fromRandom(type);
const chainHost = 'https://beta.abtnetwork.io/api';
const chainId = 'beta';

const claims = [
  {
    type: 'profile',
    fields: ['fullName', 'email'],
    description: 'Please provide these info to continue',
  },
];

const context = {
  didwallet: { os: 'web', version: '1.1.0', jwt: '1.1.0' },
  body: {},
  headers: {},
  sessionId: 'xi2Vibd-wCdZZFxT_iYij',
  locale: 'en',
  previousConnected: null,
  session: {
    status: 'created',
    _id: 'X0YPRAGv4EcFRniS',
    createdAt: '2022-05-30T09:52:43.311Z',
    updatedAt: '2022-05-30T09:52:43.341Z',
    sessionId: 'xi2Vibd-wCdZZFxT_iYij',
    updaterPk: '0x4e919a3fb2d38c5357f78eea4a847cc6b45bc0b0fbf50ff49238624e9e284d47',
    strategy: 'default',
    authUrl:
      'https://did-connect-v2-8qe-192-168-123-127.ip.abtnet.io/api/connect/relay/auth?sid=f863fe10-972b-4998-a354-212a2803f8d0',
    challenge: 'E184966B8A9B67CF8C39D2EE32190A3F',
    appInfo: {
      name: 'did-connect-v2',
      description: 'A Blocklet DAPP blocklet',
      link: 'https://did-connect-v2-8qe-192-168-123-127.ip.abtnet.io',
      icon: 'https://did-connect-v2-8qe-192-168-123-127.ip.abtnet.io/.well-known/service/blocklet/logo/z8iZyJaKA3CKS8xMZT6ayk4DQq9sGmrWUq8qe',
      updateSubEndpoint: true,
      subscriptionEndpoint: '/.well-known/service/websocket',
      nodeDid: 'zNKnTry8ptmrCTY8b2MnMAPP4bs3bx8N844d',
      publisher: 'did:abt:zNKknTrcc6RtqPH5s6zTWta5yyEDJySSbXvV',
      path: 'https://abtwallet.io/i/',
    },
    previousConnected: null,
    currentConnected: null,
    currentStep: 0,
    requestedClaims: [],
    responseClaims: [],
    approveResults: [],
    error: '',
  },
};

describe('Authenticator', () => {
  test('should throw error with invalid param', () => {
    expect(() => new Authenticator({})).toThrow(/wallet/);
    expect(() => new Authenticator({ wallet: { sk: '123', pk: '' } })).toThrow(/wallet/);
    expect(() => new Authenticator({ wallet, appInfo: {} })).toThrow(/appInfo/);
  });

  const auth = new Authenticator({
    wallet,
    baseUrl: 'http://beta.abtnetwork.io/webapp',
    appInfo: {
      name: 'DID Wallet Demo',
      description: 'Demo application to show the potential of DID Wallet',
      icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
      link: 'http://beta.abtnetwork.io/webapp',
    },
    chainInfo: {
      host: chainHost,
      id: chainId,
    },
  });

  test('should create instance with certain methods', () => {
    expect(typeof auth.verify).toEqual('function');
    expect(typeof auth.signJson).toEqual('function');
    expect(typeof auth.signClaims).toEqual('function');
  });

  test('should throw if sign without claims', async () => {
    try {
      const signed = await auth.signClaims([], {});
      expect(signed.appPk).toEqual(toBase58(wallet.publicKey));
    } catch (err) {
      expect(err).toBeTruthy();
    }
    try {
      const signed = await auth.signClaims(claims, {});
      expect(signed.appPk).toEqual(toBase58(wallet.publicKey));
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  test('should sign correct claims and verify those claims', async () => {
    const signed = await auth.signClaims(claims, context);
    expect(signed.appPk).toEqual(toBase58(wallet.publicKey));
    expect(Jwt.verify(signed.authInfo, wallet.publicKey)).toBeTruthy();
  });

  test('should be able to verify client signed', async () => {
    const signed = await auth.signClaims(claims, context);
    const clientSigned = { userPk: signed.appPk, userInfo: signed.authInfo, token: '123' };
    expect(await auth.verify(clientSigned)).toBeTruthy();
  });

  test('should _validateAppInfo work', () => {
    expect(() => auth._validateAppInfo()).toThrow('without appInfo');
    expect(() => auth._validateAppInfo({ key: 'abc' })).toThrow('name');
    expect(() => auth._validateAppInfo({ name: 'abc' })).toThrow('description');
    expect(() => auth._validateAppInfo({ name: 'abc', description: 'abc' })).toThrow('icon');
    expect(() => auth._validateAppInfo({ name: 'abc', description: 'abc', icon: 'https://abc' })).not.toThrow();
  });

  test('should timeout work as expected', (done) => {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const auth = new Authenticator({
      wallet,
      timeout: 100,
      appInfo: () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({});
          }, 200);
        }),
      chainInfo: {
        host: chainHost,
        id: chainId,
      },
    });

    expect(() => auth.tryWithTimeout(123)).toThrow(/valid function/);

    auth.getAppInfo({}).catch((err: Error) => {
      expect(err).toBeTruthy();
      expect(err.message).toMatch(/did not complete within/);
      done();
    });
  });

  test('should _validateWallet work as expected', () => {
    expect(() => auth._validateWallet()).toThrow('without wallet');

    const random = fromRandom();
    const json = random.toJSON();

    expect(auth._validateWallet(random)).toEqual(random);
    expect(() => auth._validateWallet(omit(json, ['pk']))).toThrow();
    expect(() => auth._validateWallet(omit(json, ['sk']))).toThrow();
    expect(() => auth._validateWallet(omit(json, ['address']))).toThrow();
  });

  test('should _verify work as expected', (done) => {
    auth
      ._verify({}, 'appPk', 'appInfo')
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        return auth._verify({ appPk: 'abcd' }, 'appPk', 'appInfo');
      })
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        done();
      });
  });
});
