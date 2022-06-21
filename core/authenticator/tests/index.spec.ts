/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-shadow */
import omit from 'lodash/omit';
import { types } from '@ocap/mcrypto';
import { verify, decode } from '@arcblock/jwt';
import { fromRandom, WalletType } from '@ocap/wallet';
import { toBase58 } from '@ocap/util';
import { ContextType, RequestListType } from '@did-connect/types';

import { Authenticator } from '../src';

const type = WalletType({
  role: types.RoleType.ROLE_APPLICATION,
  pk: types.KeyType.ED25519,
  hash: types.HashType.SHA3,
});

const wallet = fromRandom(type);
const chainHost = 'https://beta.abtnetwork.io/api';
const chainId = 'beta';

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const claims: RequestListType = [
  {
    type: 'profile',
    items: ['fullName', 'email'],
    description: 'Please provide these info to continue',
  },
];

const context: ContextType = {
  didwallet: { os: 'web', version: '1.1.0', jwt: '1.1.0' },
  body: {},
  headers: {},
  sessionId: 'xi2Vibd-wCdZZFxT_iYij',
  locale: 'en',
  previousConnected: null,
  signerPk: '',
  signerToken: '',
  session: {
    status: 'created',
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
    autoConnect: true,
    onlyConnect: false,
    requestedClaims: [],
    responseClaims: [],
    approveResults: [],
    error: '',
    timeout: {
      app: 10000,
      relay: 10000,
      wallet: 10000,
    },
  },
};

describe('Authenticator', () => {
  test('should throw error with invalid param', () => {
    // @ts-ignore
    expect(() => new Authenticator({})).toThrow(/wallet/);
    // @ts-ignore
    expect(() => new Authenticator({ wallet: { sk: '123', pk: '' } })).toThrow(/wallet/);
    // @ts-ignore
    expect(() => new Authenticator({ wallet, appInfo: {} })).toThrow(/appInfo/);
  });

  const auth = new Authenticator({
    wallet,
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
    timeout: 100,
  });

  test('should create instance with certain methods', () => {
    expect(typeof auth.verify).toEqual('function');
    expect(typeof auth.signJson).toEqual('function');
    expect(typeof auth.signClaims).toEqual('function');
  });

  test('should throw if sign without claims', async () => {
    try {
      // @ts-ignore
      await auth.signClaims([], context);
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeTruthy();
    }
    try {
      // @ts-ignore
      await auth.signClaims(claims, {});
      expect(true).toBeFalsy();
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });

  test('should sign correct claims and verify those claims', async () => {
    const signed = await auth.signClaims(claims, context);
    expect(signed.appPk).toEqual(toBase58(wallet.publicKey));
    expect(verify(signed.authInfo, wallet.publicKey)).toBeTruthy();
  });

  test('should signJson work as expected', async () => {
    try {
      // @ts-ignore
      await auth.signJson({}, {});
      expect(true).toBeFalsy();
    } catch (e) {
      expect(e).toBeTruthy();
    }

    let signed = await auth.signJson({}, context);
    let decoded = decode(signed.authInfo);
    expect(decoded.status).toEqual('ok');
    expect(decoded.response).toEqual({});

    signed = await auth.signJson({ key: 'value' }, context);
    decoded = decode(signed.authInfo);
    expect(decoded.status).toEqual('ok');
    expect(decoded.response).toEqual({ key: 'value' });

    signed = await auth.signJson({ error: 'value' }, context);
    decoded = decode(signed.authInfo);
    expect(decoded.status).toEqual('error');
    expect(decoded.response).toEqual({});
    expect(decoded.errorMessage).toEqual('value');

    signed = await auth.signJson({ successMessage: 'value' }, context);
    decoded = decode(signed.authInfo);
    expect(decoded.status).toEqual('ok');
    expect(decoded.response).toEqual({});
    expect(decoded.successMessage).toEqual('value');

    signed = await auth.signJson({ nextWorkflow: 'value' }, context);
    decoded = decode(signed.authInfo);
    expect(decoded.status).toEqual('ok');
    expect(decoded.response).toEqual({});
    expect(decoded.nextWorkflow).toEqual('value');
  });

  test('should be able to verify client signed', async () => {
    const signed = await auth.signClaims(claims, context);
    const clientSigned = { userPk: signed.appPk, userInfo: signed.authInfo, token: '123' };
    expect(await auth.verify(clientSigned)).toBeTruthy();
  });

  test('should _validateAppInfo work', () => {
    // @ts-ignore
    expect(() => auth._validateAppInfo()).toThrow('without appInfo');
    // @ts-ignore
    expect(() => auth._validateAppInfo({ key: 'abc' })).toThrow('name');
    // @ts-ignore
    expect(() => auth._validateAppInfo({ name: 'abc' })).toThrow('description');
    // @ts-ignore
    expect(() => auth._validateAppInfo({ name: 'abc', description: 'abc' })).toThrow('icon');
    // @ts-ignore
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

    // @ts-ignore
    expect(() => auth.tryWithTimeout(123)).toThrow(/valid function/);

    // @ts-ignore
    auth.getAppInfo({}).catch((err: Error) => {
      expect(err).toBeTruthy();
      expect(err.message).toMatch(/did not complete within/);
      done();
    });
  });

  test('should _validateWallet work as expected', () => {
    // @ts-ignore
    expect(() => auth._validateWallet()).toThrow('without wallet');

    const random = fromRandom();
    const json = random.toJSON();

    expect(auth._validateWallet(random)).toEqual(random);
    // @ts-ignore
    expect(() => auth._validateWallet(omit(json, ['pk']))).toThrow();
    // @ts-ignore
    expect(() => auth._validateWallet(omit(json, ['sk']))).toThrow();
    // @ts-ignore
    expect(() => auth._validateWallet(omit(json, ['address']))).toThrow();
  });

  test('should _verify work as expected', (done) => {
    auth
      ._verify({ userPk: '', userInfo: '' })
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        return auth._verify({ userPk: 'abcd', userInfo: '' });
      })
      .catch((err: Error) => {
        expect(err).toBeTruthy();
        done();
      });
  });

  test('should tryWithTimeout work as expected', async () => {
    try {
      await auth.tryWithTimeout(async () => {
        await sleep(200);
      });
      expect(false).toBeTruthy();
    } catch (err: any) {
      expect(err).toBeTruthy();
      expect(err.message).toMatch(/did not complete within/);
    }

    try {
      await auth.tryWithTimeout(async () => {
        throw new Error('test');
      });
      expect(false).toBeTruthy();
    } catch (err: any) {
      expect(err).toBeTruthy();
      expect(err.message).toMatch(/test/);
    }
  });
});
