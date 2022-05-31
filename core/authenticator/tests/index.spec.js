/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-shadow */
const omit = require('lodash/omit');
const Mcrypto = require('@ocap/mcrypto');
const Jwt = require('@arcblock/jwt');
const { fromRandom, WalletType } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');

const Authenticator = require('../lib');

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
  didwallet: {},
  body: {},
  headers: {},
  sessionId: 'f863fe10-972b-4998-a354-212a2803f8d0',
  locale: 'en',
  previousConnected: null,
  session: {
    status: 'created',
    _id: 'X0YPRAGv4EcFRniS',
    createdAt: '2022-05-30T09:52:43.311Z',
    updatedAt: '2022-05-30T09:52:43.341Z',
    sessionId: 'f863fe10-972b-4998-a354-212a2803f8d0',
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

  test('should timeout work as expected', async () => {
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

    try {
      await auth.getAppInfo({});
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.message).toMatch(/did not complete within/);
    }
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
      .catch((err) => {
        expect(err).toBeTruthy();
        return auth._verify({ appPk: 'abcd' }, 'appPk', 'appInfo');
      })
      .catch((err) => {
        expect(err).toBeTruthy();
        done();
      });
  });

  // FIXME: following should be moved to integration test
  // test('should signature claim work as expected', async () => {
  //   const auth = new Authenticator({
  //     wallet,
  //     baseUrl: 'http://beta.abtnetwork.io/webapp',
  //     appInfo: {
  //       name: 'DID Wallet Demo',
  //       description: 'Demo application to show the potential of DID Wallet',
  //       icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
  //       link: 'http://beta.abtnetwork.io/webapp',
  //     },
  //     chainInfo: {
  //       host: chains.beta.endpoint,
  //       id: chainId,
  //     },
  //   });

  //   const user = fromRandom();
  //   const client = new Client(chains.beta.endpoint);
  //   const result = await auth.genRequestedClaims({
  //     claims: {
  //       signature: async ({ userDid, userPk }) => {
  //         const encoded = await client.encodeTransferV2Tx({
  //           tx: {
  //             from: userDid,
  //             pk: userPk,
  //             itx: {
  //               to: wallet.address,
  //               tokens: [
  //                 {
  //                   address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt',
  //                   value: '100',
  //                 },
  //               ],
  //             },
  //           },
  //           wallet: fromPublicKey(userPk),
  //         });
  //         return {
  //           type: 'fg:t:transaction',
  //           data: toBase58(encoded.buffer),
  //         };
  //       },

  //       signature_raw: [
  //         'signature',
  //         ({ userDid, userPk }) => ({
  //           type: 'TransferV2Tx',
  //           display: JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' }),
  //           data: {
  //             from: userDid,
  //             pk: userPk,
  //             itx: {
  //               to: wallet.address,
  //               tokens: [
  //                 {
  //                   address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt',
  //                   value: '100',
  //                 },
  //               ],
  //             },
  //           },
  //         }),
  //       ],

  //       signature_text: [
  //         'signature',
  //         () => ({ type: 'mime:text/plain', data: Mcrypto.getRandomBytes(32).toString('hex') }),
  //       ],

  //       signature_html: ['signature', { type: 'mime:text/html', data: '<div>hahaha</div>' }],
  //     },
  //     context: {
  //       userDid: user.address,
  //       userPk: user.publicKey,
  //       sessionDid: user.address,
  //     },
  //     extraParams: {},
  //   });

  //   expect(result.every((x) => x.type === 'signature')).toBe(true);
  // });

  // test('should prepareTx claim work as expected', async () => {
  //   const auth = new Authenticator({
  //     wallet,
  //     baseUrl: 'http://beta.abtnetwork.io/webapp',
  //     appInfo: {
  //       name: 'DID Wallet Demo',
  //       description: 'Demo application to show the potential of DID Wallet',
  //       icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
  //       link: 'http://beta.abtnetwork.io/webapp',
  //     },
  //     chainInfo: {
  //       host: chains.beta.endpoint,
  //       id: chainId,
  //     },
  //   });

  //   const user = fromRandom();
  //   const client = new Client(chains.beta.endpoint);
  //   const requirement = {
  //     tokens: [{ address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt', value: '100' }],
  //   };
  //   const result = await auth.genRequestedClaims({
  //     claims: {
  //       prepareTx: async ({ userDid, userPk }) => {
  //         const encoded = await client.encodeTransferV2Tx({
  //           tx: {
  //             from: userDid,
  //             pk: userPk,
  //             itx: {
  //               to: wallet.address,
  //               tokens: [
  //                 {
  //                   address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt',
  //                   value: '100',
  //                 },
  //               ],
  //             },
  //           },
  //           wallet: fromPublicKey(userPk),
  //         });

  //         return {
  //           type: 'fg:t:transaction',
  //           description: 'sign',
  //           partialTx: encoded.buffer,
  //           requirement,
  //         };
  //       },

  //       prepareTx_raw: [
  //         'prepareTx',
  //         ({ userDid, userPk }) => ({
  //           type: 'TransferV2Tx',
  //           description: 'prepare',
  //           display: JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' }),
  //           partialTx: {
  //             from: userDid,
  //             pk: userPk,
  //             itx: {
  //               to: wallet.address,
  //               tokens: [
  //                 {
  //                   address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt',
  //                   value: '100',
  //                 },
  //               ],
  //             },
  //           },
  //           requirement,
  //         }),
  //       ],
  //     },
  //     context: {
  //       userDid: user.address,
  //       userPk: user.publicKey,
  //       sessionDid: user.address,
  //     },
  //     extraParams: {},
  //   });

  //   expect(result.every((x) => x.type === 'prepareTx')).toBe(true);
  // });

  // test('should profile claim work as expected', async () => {
  //   const result = await auth.genRequestedClaims({
  //     claims: {
  //       profile: () => ({
  //         description: 'profile',
  //         fields: ['fullName', 'email'],
  //       }),

  //       profile_raw: [
  //         'profile',
  //         () => ({
  //           description: 'profile raw',
  //           fields: ['fullName', 'email', 'signature'],
  //         }),
  //       ],
  //     },
  //     context: {},
  //     extraParams: {},
  //   });

  //   expect(result.every((x) => x.type === 'profile')).toBe(true);
  // });

  // test('should verifiableCredential claim work as expected', async () => {
  //   const result = await auth.genRequestedClaims({
  //     claims: {
  //       legacy: [
  //         'verifiableCredential',
  //         () => ({
  //           description: 'verifiable credential legacy',
  //           item: ['BlockletServerPassport'],
  //           trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
  //           tag: 'tag1',
  //           optional: false,
  //         }),
  //       ],
  //       v2: [
  //         'verifiableCredential',
  //         () => ({
  //           description: 'verifiable credential legacy',
  //           optional: true,
  //           filters: [
  //             {
  //               type: ['BlockletServerPassport'],
  //               trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
  //             },
  //             {
  //               trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
  //               tag: 'tag2',
  //             },
  //             {
  //               target: 'zjddPDAK5rm1E4syjTkgoiskGBAfve5YYN2s',
  //               tag: '',
  //             },
  //           ],
  //         }),
  //       ],
  //     },
  //     context: {},
  //     extraParams: {},
  //   });

  //   expect(result.every((x) => x.type === 'verifiableCredential')).toBe(true);
  // });

  // test('should asset claim work as expected', async () => {
  //   const result = await auth.genRequestedClaims({
  //     claims: {
  //       legacy: [
  //         'asset',
  //         () => ({
  //           description: 'asset legacy',
  //           trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
  //           trustedParents: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
  //           tag: 'tag1',
  //           optional: false,
  //         }),
  //       ],
  //       v2: [
  //         'asset',
  //         () => ({
  //           description: 'asset v2',
  //           optional: true,
  //           filters: [
  //             {
  //               trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
  //               tag: 'tag1',
  //             },
  //             {
  //               trustedParents: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
  //               tag: 'tag2',
  //             },
  //             {
  //               address: 'zjddPDAK5rm1E4syjTkgoiskGBAfve5YYN2s',
  //               tag: '',
  //             },
  //           ],
  //         }),
  //       ],
  //     },
  //     context: {},
  //     extraParams: {},
  //   });

  //   expect(result.every((x) => x.type === 'asset')).toBe(true);
  // });
});
