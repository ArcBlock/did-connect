/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-shadow */
const url = require('url');
const qs = require('querystring');
const omit = require('lodash/omit');
const Mcrypto = require('@ocap/mcrypto');
const Jwt = require('@arcblock/jwt');
const { fromRandom, fromPublicKey, WalletType } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');
const Client = require('@ocap/client');

const { startChains } = require('@ocap/e2e-test/fixture');

const { WalletAuthenticator } = require('../../lib');

const type = WalletType({
  role: Mcrypto.types.RoleType.ROLE_APPLICATION,
  pk: Mcrypto.types.KeyType.ED25519,
  hash: Mcrypto.types.HashType.SHA3,
});

const wallet = fromRandom(type).toJSON();
const chainHost = 'https://beta.abtnetwork.io/api';
const chainId = 'beta';

describe('#WalletAuthenticator', () => {
  let chains = {};
  beforeAll(async () => {
    chains = await startChains();
  });

  afterAll(() => {
    chains.close();
  });

  test('should formatDisplay work as expected', () => {
    const fn = WalletAuthenticator.formatDisplay;

    expect(fn('')).toEqual('');
    expect(fn(null)).toEqual('');
    expect(fn(undefined)).toEqual('');
    expect(fn(0)).toEqual('');
    expect(fn('abc')).toEqual('');
    expect(fn({ type: 'url', content: 'https://www.arcblock.io' })).toEqual(
      JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' })
    );
    expect(fn(JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' }))).toEqual(
      JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' })
    );
    expect(fn(JSON.stringify({ type: 'url' }))).toEqual('');
    expect(fn('{"value":xxx}')).toEqual('');
  });

  test('should throw error with invalid param', () => {
    expect(() => new WalletAuthenticator({ baseUrl: chainHost })).toThrow(/wallet/);
    expect(() => new WalletAuthenticator({ baseUrl: chainHost, wallet: { sk: '123', pk: '' } })).toThrow(/wallet\.pk/);
    expect(
      () =>
        new WalletAuthenticator({
          baseUrl: chainHost,
          wallet: { sk: '123', pk: '456', address: '789' },
          appInfo: {},
        })
    ).toThrow(/appInfo/);
  });

  const auth = new WalletAuthenticator({
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
    expect(typeof auth.uri).toEqual('function');
    expect(typeof auth.sign).toEqual('function');
    expect(typeof auth.verify).toEqual('function');
    expect(typeof auth.signResponse).toEqual('function');
    expect(typeof auth.getPublicUrl).toEqual('function');

    expect(typeof auth.genRequestedClaims).toEqual('function');
    expect(typeof auth.getClaimInfo).toEqual('function');

    expect(typeof auth.signature).toEqual('function');
    expect(typeof auth.prepareTx).toEqual('function');
  });

  test('should generate correct chainInfo', async () => {
    auth.chainInfo = ({ locale }) => {
      if (locale === 'en') {
        return { host: 'https://www.arcblock.io', id: '123' };
      }

      return { host: 'https://www.arcblockio.cn', id: '456' };
    };

    const enChainInfo = await auth.getChainInfo({ locale: 'en' });
    expect(enChainInfo.host).toEqual('https://www.arcblock.io');
    expect(enChainInfo.id).toEqual('123');

    const zhChainInfo = await auth.getChainInfo({ locale: 'zh' });
    expect(zhChainInfo.host).toEqual('https://www.arcblockio.cn');
    expect(zhChainInfo.id).toEqual('456');
  });

  test('should generate correct uri', async () => {
    const uri = await auth.uri();
    const parsed = url.parse(uri);
    const params = qs.parse(parsed.query);
    expect(parsed.host).toEqual('abtwallet.io');
    expect(parsed.pathname).toEqual('/i/');
    expect(params.action).toEqual('requestAuth');
    expect(decodeURIComponent(params.url).indexOf('beta.abtnetwork.io')).toBeTruthy();
  });

  test('should throw if sign without claims', async () => {
    try {
      const signed = await auth.sign({});
      expect(signed.appPk).toEqual(toBase58(wallet.pk));
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  test('should sign correct claims and verify those claims', async () => {
    const user = fromRandom();
    const userPk = toBase58(user.publicKey);
    const userDid = user.address;

    const claims = {
      profile: () => ({
        fields: ['fullName', 'email'],
        description: 'Please provide these info to continue',
      }),
    };

    const signed = await auth.sign({ context: { token: '123', userPk, userDid }, claims });
    expect(signed.appPk).toEqual(toBase58(wallet.pk));
    expect(Jwt.verify(signed.authInfo, wallet.pk)).toBeTruthy();
  });

  test('should be able to verify client signed', async () => {
    const user = fromRandom();
    const userPk = toBase58(user.publicKey);
    const userDid = user.address;

    const claims = {
      profile: () => ({
        fields: ['fullName', 'email'],
        description: 'Please provide these info to continue',
      }),
    };

    const signed = await auth.sign({ context: { token: '123', userPk, userDid }, claims });
    const clientSigned = { userPk: signed.appPk, userInfo: signed.authInfo, token: '123' };
    expect(await auth.verify(clientSigned)).toBeTruthy();
  });

  test('should generate correct none chainInfo', async () => {
    const tmp = new WalletAuthenticator({
      wallet,
      baseUrl: 'http://beta.abtnetwork.io/webapp',
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
        link: 'http://beta.abtnetwork.io/webapp',
      },
    });

    const chainInfo = await tmp.getChainInfo({ locale: 'en' });
    expect(chainInfo.host).toEqual('none');
    expect(chainInfo.id).toEqual('none');
  });

  test('should _validateAppInfo work', () => {
    expect(() => auth._validateAppInfo()).toThrow('empty');
    expect(() => auth._validateAppInfo({ key: 'abc' })).toThrow('name');
    expect(() => auth._validateAppInfo({ name: 'abc' })).toThrow('description');
    expect(() => auth._validateAppInfo({ name: 'abc', description: 'abc' })).toThrow('icon');
    expect(() => auth._validateAppInfo({ name: 'abc', description: 'abc', icon: 'https://abc' })).not.toThrow();
  });

  test('should timeout work as expected', async () => {
    const auth = new WalletAuthenticator({
      wallet,
      baseUrl: 'http://beta.abtnetwork.io/webapp',
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

    expect(auth._validateWallet(random)).toEqual(omit(json, ['type']));

    expect(auth._validateWallet(json)).toEqual(json);

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

  test('should signature claim work as expected', async () => {
    const auth = new WalletAuthenticator({
      wallet,
      baseUrl: 'http://beta.abtnetwork.io/webapp',
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
        link: 'http://beta.abtnetwork.io/webapp',
      },
      chainInfo: {
        host: chains.beta.endpoint,
        id: chainId,
      },
    });

    const user = fromRandom();
    const client = new Client(chains.beta.endpoint);
    const result = await auth.genRequestedClaims({
      claims: {
        signature: async ({ userDid, userPk }) => {
          const encoded = await client.encodeTransferV2Tx({
            tx: {
              from: userDid,
              pk: userPk,
              itx: {
                to: wallet.address,
                tokens: [
                  {
                    address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt',
                    value: '100',
                  },
                ],
              },
            },
            wallet: fromPublicKey(userPk),
          });
          return {
            type: 'fg:t:transaction',
            data: toBase58(encoded.buffer),
          };
        },

        signature_raw: [
          'signature',
          ({ userDid, userPk }) => ({
            type: 'TransferV2Tx',
            display: JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' }),
            data: {
              from: userDid,
              pk: userPk,
              itx: {
                to: wallet.address,
                tokens: [
                  {
                    address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt',
                    value: '100',
                  },
                ],
              },
            },
          }),
        ],

        signature_text: [
          'signature',
          () => ({ type: 'mime:text/plain', data: Mcrypto.getRandomBytes(32).toString('hex') }),
        ],

        signature_html: ['signature', { type: 'mime:text/html', data: '<div>hahaha</div>' }],
      },
      context: {
        userDid: user.address,
        userPk: user.publicKey,
        sessionDid: user.address,
      },
      extraParams: {},
    });

    expect(result.every((x) => x.type === 'signature')).toBe(true);
  });

  test('should prepareTx claim work as expected', async () => {
    const auth = new WalletAuthenticator({
      wallet,
      baseUrl: 'http://beta.abtnetwork.io/webapp',
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
        link: 'http://beta.abtnetwork.io/webapp',
      },
      chainInfo: {
        host: chains.beta.endpoint,
        id: chainId,
      },
    });

    const user = fromRandom();
    const client = new Client(chains.beta.endpoint);
    const requirement = {
      tokens: [{ address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt', value: '100' }],
    };
    const result = await auth.genRequestedClaims({
      claims: {
        prepareTx: async ({ userDid, userPk }) => {
          const encoded = await client.encodeTransferV2Tx({
            tx: {
              from: userDid,
              pk: userPk,
              itx: {
                to: wallet.address,
                tokens: [
                  {
                    address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt',
                    value: '100',
                  },
                ],
              },
            },
            wallet: fromPublicKey(userPk),
          });

          return {
            type: 'fg:t:transaction',
            description: 'sign',
            partialTx: encoded.buffer,
            requirement,
          };
        },

        prepareTx_raw: [
          'prepareTx',
          ({ userDid, userPk }) => ({
            type: 'TransferV2Tx',
            description: 'prepare',
            display: JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' }),
            partialTx: {
              from: userDid,
              pk: userPk,
              itx: {
                to: wallet.address,
                tokens: [
                  {
                    address: 'z35nB2SA6xxBuoaiuUXUw6Gah2SNU3UzqdgEt',
                    value: '100',
                  },
                ],
              },
            },
            requirement,
          }),
        ],
      },
      context: {
        userDid: user.address,
        userPk: user.publicKey,
        sessionDid: user.address,
      },
      extraParams: {},
    });

    expect(result.every((x) => x.type === 'prepareTx')).toBe(true);
  });

  test('should profile claim work as expected', async () => {
    const result = await auth.genRequestedClaims({
      claims: {
        profile: () => ({
          description: 'profile',
          fields: ['fullName', 'email'],
        }),

        profile_raw: [
          'profile',
          () => ({
            description: 'profile raw',
            fields: ['fullName', 'email', 'signature'],
          }),
        ],
      },
      context: {},
      extraParams: {},
    });

    expect(result.every((x) => x.type === 'profile')).toBe(true);
  });

  test('should verifiableCredential claim work as expected', async () => {
    const result = await auth.genRequestedClaims({
      claims: {
        legacy: [
          'verifiableCredential',
          () => ({
            description: 'verifiable credential legacy',
            item: ['BlockletServerPassport'],
            trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
            tag: 'tag1',
            optional: false,
          }),
        ],
        v2: [
          'verifiableCredential',
          () => ({
            description: 'verifiable credential legacy',
            optional: true,
            filters: [
              {
                type: ['BlockletServerPassport'],
                trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
              },
              {
                trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
                tag: 'tag2',
              },
              {
                target: 'zjddPDAK5rm1E4syjTkgoiskGBAfve5YYN2s',
                tag: '',
              },
            ],
          }),
        ],
      },
      context: {},
      extraParams: {},
    });

    expect(result.every((x) => x.type === 'verifiableCredential')).toBe(true);
  });

  test('should asset claim work as expected', async () => {
    const result = await auth.genRequestedClaims({
      claims: {
        legacy: [
          'asset',
          () => ({
            description: 'asset legacy',
            trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
            trustedParents: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
            tag: 'tag1',
            optional: false,
          }),
        ],
        v2: [
          'asset',
          () => ({
            description: 'asset v2',
            optional: true,
            filters: [
              {
                trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
                tag: 'tag1',
              },
              {
                trustedParents: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
                tag: 'tag2',
              },
              {
                address: 'zjddPDAK5rm1E4syjTkgoiskGBAfve5YYN2s',
                tag: '',
              },
            ],
          }),
        ],
      },
      context: {},
      extraParams: {},
    });

    expect(result.every((x) => x.type === 'asset')).toBe(true);
  });
});
