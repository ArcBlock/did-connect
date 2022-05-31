/* eslint-disable import/no-extraneous-dependencies */
const axios = require('axios');
const qs = require('querystring');
const url = require('url');
const tweetnacl = require('tweetnacl');
const Mcrypto = require('@ocap/mcrypto');
const Jwt = require('@arcblock/jwt');
const SealedBox = require('tweetnacl-sealedbox-js');
const MemoryAuthStorage = require('@did-connect/storage-memory');
const { fromRandom, WalletType } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');

const createTestServer = require('../../../../scripts/create-test-server');
const { WalletHandlers, Authenticator: Authenticator } = require('../../lib');

const type = WalletType({
  role: Mcrypto.types.RoleType.ROLE_APPLICATION,
  pk: Mcrypto.types.KeyType.ED25519,
  hash: Mcrypto.types.HashType.SHA3,
});

const user = fromRandom();
const app = fromRandom(type);
const chainHost = 'https://beta.abtnetwork.io/api';
const chainId = 'beta';
const noop = () => {};
const headers = {
  'User-Agent': 'ArcWallet/1.3.29 iPhone12,3 iOS/13.0 CFNetwork/1098.7 Darwin/19.0.0',
};

// https://github.com/joaquimserafim/base64-url/blob/54d9c9ede66a8724f280cf24fd18c38b9a53915f/index.js#L10
const escape = (str) => str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const encodeEncKey = (key) => escape(Buffer.from(key).toString('base64'));

describe('#WalletHandlers', () => {
  let server;

  beforeAll(async () => {
    server = await createTestServer();
  });

  test('should handle common did-auth attach as expected', async () => {
    const tokenStorage = new MemoryAuthStorage();
    const authenticator = new Authenticator({
      wallet: app.toJSON(),
      // baseUrl: server.url,
      appInfo: ({ baseUrl }) => ({
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
        link: baseUrl,
        updateSubEndpoint: true,
        subscriptionEndpoint: '/api/websocket',
        nodeDid: 'z1Zg7PUWJX2NS9cRhpjuMtvjjLK5W2E3Wsh',
      }),
      chainInfo: () => ({
        host: chainHost,
        id: chainId,
      }),
    });
    const handlers = new WalletHandlers({ tokenStorage, authenticator });

    expect(() => handlers.attach({ app: server, action: 'login' })).toThrow();
    expect(() => handlers.attach({ app: server, action: 'login', onAuth: noop, onDecline: 'xxx' })).toThrow();
    expect(() =>
      handlers.attach({ app: server, action: 'login', onAuth: noop, onDecline: noop, onComplete: 'xxx' })
    ).toThrow();

    const encKey = tweetnacl.box.keyPair();
    const unsecure = 'unsecure';
    const secure = 'secure';
    const secureObj = { secure: true };

    handlers.attach({
      app: server,
      action: 'login',
      claims: {
        profile: ({ userDid, didwallet }) => {
          expect(userDid).toEqual(user.address);
          expect(didwallet.os).toEqual('ios');
          expect(didwallet.version).toEqual('1.3.29');
          return {
            fields: ['fullName', 'email'],
            description: 'test',
          };
        },
      },
      onStart: ({ extraParams }) => {
        expect(extraParams).toBeTruthy();
      },
      onAuth: async ({ claims, didwallet, updateSession }) => {
        const profile = claims.find((x) => x.type === 'profile');
        expect(profile).toBeTruthy();
        expect(profile.email).toEqual('shijun@arcblock.io');
        expect(profile.fullName).toEqual('wangshijun');
        expect(didwallet.os).toEqual('ios');
        expect(didwallet.version).toEqual('1.3.29');

        await updateSession('unsecure', unsecure);
        await updateSession({ secure, secureObj }, true);

        return { successMessage: 'abc', nextWorkflowData: 'xyz' };
      },
    });

    // gen workflow
    const { data } = await axios.get(`${server.url}/api/did/login/token`);
    const nextWorkflow = decodeURIComponent(new URL(data.url).searchParams.get('url'));
    const nextToken = data.token;

    // Test api endpoint
    const { data: info } = await axios.get(
      `${server.url}/api/did/login/token?${qs.stringify({
        nw: nextWorkflow,
        _ek_: encodeEncKey(encKey.publicKey),
      })}`
    );
    const getTokenState = (token = info.token) => axios.get(`${server.url}/api/did/login/status?_t_=${token}`);
    expect(info.token).toBeTruthy();
    expect(info.url.indexOf(info.token) > 0).toBeTruthy();

    // Parse auth url from wallet
    const parsed = url.parse(info.url);
    const authUrl = decodeURIComponent(qs.parse(parsed.search).url);
    expect(authUrl.indexOf(info.token) > 0).toBeTruthy();

    // Check token status
    const { data: info2 } = await getTokenState();
    expect(info2.token).toEqual(info.token);
    expect(info2.appInfo).toBeTruthy();
    expect(info2.appInfo.name).toBeTruthy();
    expect(info2.appInfo.description).toBeTruthy();
    expect(info2.appInfo.icon).toBeTruthy();
    expect(info2.appInfo.link).toBeTruthy();
    expect(info2.appInfo.path).toBeTruthy();
    expect(info2.appInfo.publisher).toBeTruthy();
    expect(info2.status).toEqual('created');
    expect(info2.currentStep).toEqual(0);

    // Simulate wallet scan
    const { data: info3 } = await axios.get(authUrl, { headers });
    expect(info3.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info3.authInfo, info3.appPk)).toEqual(true);

    // Check token status
    const { data: info4 } = await getTokenState();
    expect(info4.token).toEqual(info.token);
    expect(info4.status).toEqual('scanned');
    expect(info4.currentStep).toEqual(0);

    const authInfo1 = Jwt.decode(info3.authInfo);
    expect(authInfo1.iss).toEqual(`did:abt:${app.address}`);
    expect(authInfo1.appInfo.link).toEqual(server.url);

    // Submit auth principal
    const { data: info5 } = await axios.post(
      authInfo1.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo1.challenge }),
      },
      { headers }
    );
    const authInfo2 = Jwt.decode(info5.authInfo);
    // console.log('authInfo2', authInfo2);

    expect(authInfo1.challenge).toBeTruthy();
    expect(authInfo2.challenge).toBeTruthy();
    expect(authInfo1.challenge).not.toEqual(authInfo2.challenge);

    // Check store status: scanned
    const { data: info6 } = await getTokenState();
    expect(info6.token).toEqual(info.token);
    expect(info6.status).toEqual('scanned');
    expect(info6.currentStep).toEqual(1);

    // Submit profile claim: without challenge
    const { data: infoX } = await axios.post(
      authInfo2.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
        }),
      },
      { headers }
    );
    const authInfoX = Jwt.decode(infoX.authInfo);
    expect(authInfoX.status).toEqual('error');
    expect(authInfoX.errorMessage).toEqual('Challenge mismatch');

    // Submit profile claim: with challenge
    const { data: info7 } = await axios.post(
      authInfo2.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
          challenge: authInfo2.challenge,
        }),
      },
      { headers }
    );
    const authInfo3 = Jwt.decode(info7.authInfo);
    // eslint-disable-next-line no-console
    // console.log('authInfo3', authInfo3);
    expect(authInfo3.successMessage).toEqual('abc');
    expect(authInfo3.nextWorkflow).toEqual(`${nextWorkflow}&previousWorkflowData=Inh5eiI`);

    // Check store status: succeed
    const { data: info8 } = await getTokenState();
    expect(info8.token).toEqual(info.token);
    expect(info8.status).toEqual('succeed');
    expect(info8.currentStep).toEqual(1);

    const { data: info9 } = await getTokenState();
    expect(info9.unsecure).toEqual(unsecure);
    expect(
      JSON.parse(
        Buffer.from(
          SealedBox.open(new Uint8Array(Buffer.from(info9.secure, 'base64')), encKey.publicKey, encKey.secretKey)
        ).toString('utf8')
      )
    ).toEqual(secure);
    expect(
      JSON.parse(
        Buffer.from(
          SealedBox.open(new Uint8Array(Buffer.from(info9.secureObj, 'base64')), encKey.publicKey, encKey.secretKey)
        ).toString('utf8')
      )
    ).toEqual(secureObj);

    // Simulate wallet scan
    const { data: info10 } = await axios.get(authInfo3.nextWorkflow, { headers });
    expect(info10.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info10.authInfo, info10.appPk)).toEqual(true);

    const { data: info11 } = await getTokenState(nextToken);
    expect(info11.extraParams.previousWorkflowData).toEqual('xyz');
    expect(info11.status).toEqual('scanned');
  });

  test('should handle deepLink nextWorkflow and previousWorkflowData as expected', async () => {
    const tokenStorage = new MemoryAuthStorage();
    const authenticator = new Authenticator({
      wallet: app.toJSON(),
      appInfo: ({ baseUrl }) => ({
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
        link: baseUrl,
        updateSubEndpoint: true,
        subscriptionEndpoint: '/api/websocket',
        nodeDid: 'z1Zg7PUWJX2NS9cRhpjuMtvjjLK5W2E3Wsh',
      }),
      chainInfo: () => ({
        host: chainHost,
        id: chainId,
      }),
    });
    const handlers = new WalletHandlers({ tokenStorage, authenticator });

    handlers.attach({
      app: server,
      action: 'deep-link',
      claims: {
        profile: ({ userDid, didwallet }) => {
          expect(userDid).toEqual(user.address);
          expect(didwallet.os).toEqual('ios');
          expect(didwallet.version).toEqual('1.3.29');
          return {
            fields: ['fullName', 'email'],
            description: 'test',
          };
        },
      },
      onStart: ({ extraParams }) => {
        expect(extraParams).toBeTruthy();
      },
      onAuth: () => {
        return { successMessage: 'abc', nextWorkflowData: 'xyz' };
      },
    });

    // gen workflow
    const { data } = await axios.get(`${server.url}/api/did/deep-link/token`);
    const nextWorkflow = data.url;
    const nextToken = data.token;

    // Test api endpoint
    const { data: info } = await axios.get(
      `${server.url}/api/did/deep-link/token?${qs.stringify({
        nw: nextWorkflow,
      })}`
    );
    const getTokenState = (token = info.token) => axios.get(`${server.url}/api/did/deep-link/status?_t_=${token}`);
    expect(info.token).toBeTruthy();
    expect(info.url.indexOf(info.token) > 0).toBeTruthy();

    // Parse auth url from wallet
    const parsed = url.parse(info.url);
    const authUrl = decodeURIComponent(qs.parse(parsed.search).url);
    expect(authUrl.indexOf(info.token) > 0).toBeTruthy();

    // Check token status
    const { data: info2 } = await getTokenState();
    expect(info2.token).toEqual(info.token);
    expect(info2.appInfo).toBeTruthy();
    expect(info2.appInfo.name).toBeTruthy();
    expect(info2.appInfo.description).toBeTruthy();
    expect(info2.appInfo.icon).toBeTruthy();
    expect(info2.appInfo.link).toBeTruthy();
    expect(info2.appInfo.path).toBeTruthy();
    expect(info2.appInfo.publisher).toBeTruthy();
    expect(info2.status).toEqual('created');
    expect(info2.currentStep).toEqual(0);

    // Simulate wallet scan
    const { data: info3 } = await axios.get(authUrl, { headers });
    expect(info3.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info3.authInfo, info3.appPk)).toEqual(true);

    // Check token status
    const { data: info4 } = await getTokenState();
    expect(info4.token).toEqual(info.token);
    expect(info4.status).toEqual('scanned');
    expect(info4.currentStep).toEqual(0);

    const authInfo1 = Jwt.decode(info3.authInfo);
    expect(authInfo1.iss).toEqual(`did:abt:${app.address}`);
    expect(authInfo1.appInfo.link).toEqual(server.url);

    // Submit auth principal
    const { data: info5 } = await axios.post(
      authInfo1.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo1.challenge }),
      },
      { headers }
    );
    const authInfo2 = Jwt.decode(info5.authInfo);
    // console.log('authInfo2', authInfo2);

    expect(authInfo1.challenge).toBeTruthy();
    expect(authInfo2.challenge).toBeTruthy();
    expect(authInfo1.challenge).not.toEqual(authInfo2.challenge);

    // Check store status: scanned
    const { data: info6 } = await getTokenState();
    expect(info6.token).toEqual(info.token);
    expect(info6.status).toEqual('scanned');
    expect(info6.currentStep).toEqual(1);

    // Submit profile claim: without challenge
    const { data: infoX } = await axios.post(
      authInfo2.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
        }),
      },
      { headers }
    );
    const authInfoX = Jwt.decode(infoX.authInfo);
    expect(authInfoX.status).toEqual('error');
    expect(authInfoX.errorMessage).toEqual('Challenge mismatch');

    // Submit profile claim: with challenge
    const { data: info7 } = await axios.post(
      authInfo2.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
          challenge: authInfo2.challenge,
        }),
      },
      { headers }
    );
    const authInfo3 = Jwt.decode(info7.authInfo);
    // eslint-disable-next-line no-console
    // console.log('authInfo3', authInfo3);
    expect(authInfo3.successMessage).toEqual('abc');
    expect(authInfo3.nextWorkflow.indexOf('previousWorkflowData') > 0).toEqual(true);
    expect(authInfo3.nextWorkflow.indexOf('Inh5eiI') > 0).toEqual(true);

    // Check store status: succeed
    const { data: info8 } = await getTokenState();
    expect(info8.token).toEqual(info.token);
    expect(info8.status).toEqual('succeed');
    expect(info8.currentStep).toEqual(1);

    // Simulate wallet scan
    const nextUrl = decodeURIComponent(new URL(authInfo3.nextWorkflow).searchParams.get('url'));
    const { data: info10 } = await axios.get(nextUrl, { headers });
    expect(info10.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info10.authInfo, info10.appPk)).toEqual(true);

    const { data: info11 } = await getTokenState(nextToken);
    expect(info11.extraParams.previousWorkflowData).toEqual('xyz');
    expect(info11.status).toEqual('scanned');
  });

  test('should handle custom walletInfo as expected', async () => {
    const tokenStorage = new MemoryAuthStorage();
    const authenticator = new Authenticator({
      wallet: () => app.toJSON(),
      baseUrl: server.url,
      appInfo: () => ({
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
      }),
      chainInfo: () => ({
        host: chainHost,
        id: chainId,
      }),
    });
    const handlers = new WalletHandlers({ tokenStorage, authenticator });
    const chainInfo = {
      host: 'https://beta.abtnetwork.io/api',
      id: 'beta',
    };

    handlers.attach({
      app: server,
      action: 'test',
      authPrincipal: { chainInfo },
      claims: {
        profile: () => ({
          fields: ['fullName', 'email'],
          description: 'test',
        }),
      },
      onAuth: noop,
    });

    // Test api endpoint
    const { data: info } = await axios.get(`${server.url}/api/did/test/token`);
    const getTokenState = () => axios.get(`${server.url}/api/did/test/status?_t_=${info.token}`);
    expect(info.token).toBeTruthy();
    expect(info.url.indexOf(info.token) > 0).toBeTruthy();

    // Parse auth url from wallet
    const parsed = url.parse(info.url);
    const authUrl = decodeURIComponent(qs.parse(parsed.search).url);
    expect(authUrl.indexOf(info.token) > 0).toBeTruthy();

    // Check token status
    const { data: info2 } = await getTokenState();
    expect(info2.token).toEqual(info.token);
    expect(info2.status).toEqual('created');
    expect(info2.currentStep).toEqual(0);

    // Simulate wallet scan
    const { data: info3 } = await axios.get(authUrl, { headers });
    expect(info3.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info3.authInfo, info3.appPk)).toEqual(true);

    // Check token status
    const { data: info4 } = await getTokenState();
    expect(info4.token).toEqual(info.token);
    expect(info4.status).toEqual('scanned');
    expect(info4.currentStep).toEqual(0);

    const authInfo1 = Jwt.decode(info3.authInfo);
    expect(authInfo1.iss).toEqual(`did:abt:${app.address}`);
    expect(authInfo1.chainInfo).toEqual(chainInfo);
  });

  test('should handle custom chainInfo as expected', async () => {
    const tokenStorage = new MemoryAuthStorage();
    const authenticator = new Authenticator({
      wallet: app.toJSON(),
      baseUrl: server.url,
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
      },
      chainInfo: {
        host: chainHost,
        id: chainId,
      },
    });
    const handlers = new WalletHandlers({ tokenStorage, authenticator });
    const chainInfo = {
      host: 'https://main.abtnetwork.io/api',
    };

    handlers.attach({
      app: server,
      action: 'custom-chain-info',
      authPrincipal: { chainInfo },
      claims: {
        profile: () => ({
          fields: ['fullName', 'email'],
          description: 'custom-chain-info',
          chainInfo,
        }),
      },
      onAuth: noop,
    });

    // Test api endpoint
    const { data: info } = await axios.get(`${server.url}/api/did/custom-chain-info/token`);
    const getTokenState = () => axios.get(`${server.url}/api/did/custom-chain-info/status?_t_=${info.token}`);
    expect(info.token).toBeTruthy();
    expect(info.url.indexOf(info.token) > 0).toBeTruthy();

    // Parse auth url from wallet
    const parsed = url.parse(info.url);
    const authUrl = decodeURIComponent(qs.parse(parsed.search).url);
    expect(authUrl.indexOf(info.token) > 0).toBeTruthy();

    // Check token status
    const { data: info2 } = await getTokenState();
    expect(info2.token).toEqual(info.token);
    expect(info2.status).toEqual('created');
    expect(info2.currentStep).toEqual(0);

    // Simulate wallet scan
    const { data: info3 } = await axios.get(authUrl, { headers });
    expect(info3.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info3.authInfo, info3.appPk)).toEqual(true);

    // Check token status
    const { data: info4 } = await getTokenState();
    expect(info4.token).toEqual(info.token);
    expect(info4.status).toEqual('scanned');
    expect(info4.currentStep).toEqual(0);

    const authInfo1 = Jwt.decode(info3.authInfo);
    expect(authInfo1.iss).toEqual(`did:abt:${app.address}`);
    expect(authInfo1.chainInfo).toEqual(chainInfo);

    // submit auth principal
    const { data: info5 } = await axios.post(
      authInfo1.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo1.challenge }),
      },
      { headers }
    );
    const authInfo2 = Jwt.decode(info5.authInfo);
    expect(authInfo2.chainInfo).toEqual(chainInfo);
  });

  test('should handle error as expected', async () => {
    const tokenStorage = new MemoryAuthStorage();
    const authenticator = new Authenticator({
      wallet: app,
      baseUrl: server.url,
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
      },
    });
    const handlers = new WalletHandlers({ tokenStorage, authenticator });

    // Simulate error
    handlers.attach({
      app: server,
      action: 'test-error',
      claims: {
        profile: () => {
          throw new Error('This is an error');
        },
      },
      onAuth: noop,
      onError: noop,
    });

    // Test api endpoint
    const { data: info } = await axios.get(`${server.url}/api/did/test-error/token`);

    // Parse auth url from wallet
    const parsed = url.parse(info.url);
    const authUrl = decodeURIComponent(qs.parse(parsed.search).url);
    expect(authUrl.indexOf(info.token) > 0).toBeTruthy();

    // Simulate wallet scan
    const { data: info3 } = await axios.get(authUrl, { headers });
    expect(Jwt.verify(info3.authInfo, info3.appPk)).toEqual(true);

    const authInfo1 = Jwt.decode(info3.authInfo);

    // Submit auth principal
    const { data: info5 } = await axios.post(
      authInfo1.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo1.challenge }),
      },
      { headers }
    );
    const authInfo2 = Jwt.decode(info5.authInfo);
    expect(authInfo2.status).toEqual('error');
    expect(authInfo2.errorMessage).toEqual('This is an error');
  });

  test('should handle multiple workflow as expected', async () => {
    const tokenStorage = new MemoryAuthStorage();
    const authenticator = new Authenticator({
      wallet: app,
      baseUrl: server.url,
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
      },
    });
    const handlers = new WalletHandlers({ tokenStorage, authenticator });

    let nextWorkflow = null;
    let nextToken = null;

    handlers.attach({
      app: server,
      action: 'multiple',
      claims: {
        profile: () => ({
          fields: ['fullName', 'email'],
          description: 'test',
        }),
      },
      // eslint-disable-next-line consistent-return
      onAuth: async () => {
        if (!nextToken) {
          const { data: info } = await axios.get(`${server.url}/api/did/multiple/token`);
          nextWorkflow = info.url;
          nextToken = info.token;
          return { nextWorkflow, nextToken };
        }
      },
    });

    // Test api endpoint
    const { data: info } = await axios.get(`${server.url}/api/did/multiple/token`);
    const getTokenState = () => axios.get(`${server.url}/api/did/multiple/status?_t_=${info.token}`);
    expect(info.token).toBeTruthy();
    expect(info.url.indexOf(info.token) > 0).toBeTruthy();

    // Parse auth url from wallet
    const parsed = url.parse(info.url);
    const authUrl = decodeURIComponent(qs.parse(parsed.search).url);
    expect(authUrl.indexOf(info.token) > 0).toBeTruthy();

    // Check token status
    const { data: info2 } = await getTokenState();
    expect(info2.token).toEqual(info.token);
    expect(info2.status).toEqual('created');
    expect(info2.currentStep).toEqual(0);

    // Simulate wallet scan
    const { data: info3 } = await axios.get(authUrl, { headers });
    expect(info3.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info3.authInfo, info3.appPk)).toEqual(true);

    // Check token status
    const { data: info4 } = await getTokenState();
    expect(info4.token).toEqual(info.token);
    expect(info4.status).toEqual('scanned');
    expect(info4.currentStep).toEqual(0);

    const authInfo1 = Jwt.decode(info3.authInfo);

    // Submit auth principal
    const { data: info5 } = await axios.post(
      authInfo1.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo1.challenge }),
      },
      { headers }
    );
    const authInfo2 = Jwt.decode(info5.authInfo);

    // Check store status: scanned
    const { data: info6 } = await getTokenState();
    expect(info6.token).toEqual(info.token);
    expect(info6.status).toEqual('scanned');
    expect(info6.currentStep).toEqual(1);

    // Submit profile claim
    const { data: info7 } = await axios.post(
      authInfo2.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
          challenge: authInfo2.challenge,
        }),
      },
      { headers }
    );
    const authInfo3 = Jwt.decode(info7.authInfo);
    expect(authInfo3.nextWorkflow).toEqual(nextWorkflow);
    expect(authInfo3.response.nextToken).toEqual(nextToken);

    // Check store status: succeed
    const { data: info8 } = await getTokenState();
    expect(info8.token).toEqual(info.token);
    expect(info8.status).toEqual('scanned');

    // Continue to next workflow
    const getNextTokenState = () => axios.get(`${server.url}/api/did/multiple/status?_t_=${nextToken}`);

    // Simulate wallet scan
    const authUrl2 = decodeURIComponent(qs.parse(url.parse(nextWorkflow).search).url);
    const { data: info9 } = await axios.get(authUrl2, { headers });
    const authInfo4 = Jwt.decode(info9.authInfo);

    // Submit auth principal
    const { data: info10 } = await axios.post(
      authInfo4.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo4.challenge }),
      },
      { headers }
    );
    const authInfo5 = Jwt.decode(info10.authInfo);

    // Submit profile claim again
    const { data: info11 } = await axios.post(
      authInfo5.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
          challenge: authInfo5.challenge,
        }),
      },
      { headers }
    );
    expect(info11).toBeTruthy();

    const { data: info12 } = await getTokenState();
    expect(info12.token).toEqual(info.token);
    expect(info12.status).toEqual('succeed');
    const { data: info13 } = await getNextTokenState();
    expect(info13.token).toEqual(nextToken);
    expect(info13.status).toEqual('succeed');
  });

  test('should handle dynamic claim + nextWorkflow as expected', async () => {
    const tokenStorage = new MemoryAuthStorage();
    const authenticator = new Authenticator({
      wallet: app,
      baseUrl: server.url,
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
      },
    });
    const handlers = new WalletHandlers({ tokenStorage, authenticator });

    let nextWorkflow = null;
    let nextToken = null;

    handlers.attach({
      app: server,
      action: 'dynamic',
      onConnect: () => {
        return {
          profile: () => ({
            fields: ['fullName', 'email'],
            description: 'test',
          }),
        };
      },

      // eslint-disable-next-line consistent-return
      onAuth: async () => {
        if (!nextToken) {
          const { data: info } = await axios.get(`${server.url}/api/did/dynamic/token`);
          nextWorkflow = info.url;
          nextToken = info.token;
          return { nextWorkflow, nextToken };
        }
      },
    });

    // Test api endpoint
    const { data: info } = await axios.get(`${server.url}/api/did/dynamic/token`);
    const getTokenState = () => axios.get(`${server.url}/api/did/dynamic/status?_t_=${info.token}`);
    expect(info.token).toBeTruthy();
    expect(info.url.indexOf(info.token) > 0).toBeTruthy();

    // Parse auth url from wallet
    const parsed = url.parse(info.url);
    const authUrl = decodeURIComponent(qs.parse(parsed.search).url);
    expect(authUrl.indexOf(info.token) > 0).toBeTruthy();

    // Check token status
    const { data: info2 } = await getTokenState();
    expect(info2.token).toEqual(info.token);
    expect(info2.status).toEqual('created');
    expect(info2.currentStep).toEqual(0);

    // Simulate wallet scan
    const { data: info3 } = await axios.get(authUrl, { headers });
    expect(info3.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info3.authInfo, info3.appPk)).toEqual(true);

    // Check token status
    const { data: info4 } = await getTokenState();
    expect(info4.token).toEqual(info.token);
    expect(info4.status).toEqual('scanned');
    expect(info4.currentStep).toEqual(0);

    const authInfo1 = Jwt.decode(info3.authInfo);

    // Submit auth principal
    const { data: info5 } = await axios.post(
      authInfo1.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo1.challenge }),
      },
      { headers }
    );
    const authInfo2 = Jwt.decode(info5.authInfo);

    // Check store status: scanned
    const { data: info6 } = await getTokenState();
    expect(info6.token).toEqual(info.token);
    expect(info6.status).toEqual('scanned');
    expect(info6.currentStep).toEqual(1);

    // Submit profile claim
    const { data: info7 } = await axios.post(
      authInfo2.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
          challenge: authInfo2.challenge,
        }),
      },
      { headers }
    );
    const authInfo3 = Jwt.decode(info7.authInfo);
    expect(authInfo3.nextWorkflow).toEqual(nextWorkflow);
    expect(authInfo3.response.nextToken).toEqual(nextToken);

    // Check store status: succeed
    const { data: info8 } = await getTokenState();
    expect(info8.token).toEqual(info.token);
    expect(info8.status).toEqual('scanned');

    // Continue to next workflow
    const getNextTokenState = () => axios.get(`${server.url}/api/did/dynamic/status?_t_=${nextToken}`);

    // Simulate wallet scan
    const authUrl2 = decodeURIComponent(qs.parse(url.parse(nextWorkflow).search).url);
    const { data: info9 } = await axios.get(authUrl2, { headers });
    const authInfo4 = Jwt.decode(info9.authInfo);

    // Submit auth principal
    const { data: info10 } = await axios.post(
      authInfo4.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo4.challenge }),
      },
      { headers }
    );
    const authInfo5 = Jwt.decode(info10.authInfo);

    // Submit profile claim again
    const { data: info11 } = await axios.post(
      authInfo5.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
          challenge: authInfo5.challenge,
        }),
      },
      { headers }
    );
    expect(info11).toBeTruthy();

    const { data: info12 } = await getTokenState();
    expect(info12.token).toEqual(info.token);
    expect(info12.status).toEqual('succeed');
    const { data: info13 } = await getNextTokenState();
    expect(info13.token).toEqual(nextToken);
    expect(info13.status).toEqual('succeed');
  });

  test('should handle authPrincipal only claim + nextWorkflow as expected', async () => {
    const tokenStorage = new MemoryAuthStorage();
    const authenticator = new Authenticator({
      wallet: app,
      baseUrl: server.url,
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
      },
    });
    const handlers = new WalletHandlers({ tokenStorage, authenticator });

    let nextWorkflow = null;
    let nextToken = null;

    handlers.attach({
      app: server,
      action: 'connectOnly',

      // eslint-disable-next-line consistent-return
      onAuth: async () => {
        if (!nextToken) {
          const { data: info } = await axios.get(`${server.url}/api/did/connectOnly/token`);
          nextWorkflow = info.url;
          nextToken = info.token;
          return { nextWorkflow, nextToken };
        }
      },
    });

    // Test api endpoint
    const { data: info } = await axios.get(`${server.url}/api/did/connectOnly/token`);
    const getTokenState = () => axios.get(`${server.url}/api/did/connectOnly/status?_t_=${info.token}`);
    expect(info.token).toBeTruthy();
    expect(info.url.indexOf(info.token) > 0).toBeTruthy();

    // Parse auth url from wallet
    const parsed = url.parse(info.url);
    const authUrl = decodeURIComponent(qs.parse(parsed.search).url);
    expect(authUrl.indexOf(info.token) > 0).toBeTruthy();

    // Check token status
    const { data: info2 } = await getTokenState();
    expect(info2.token).toEqual(info.token);
    expect(info2.status).toEqual('created');
    expect(info2.currentStep).toEqual(0);

    // Simulate wallet scan
    const { data: info3 } = await axios.get(authUrl, { headers });
    expect(info3.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info3.authInfo, info3.appPk)).toEqual(true);

    // Check token status
    const { data: info4 } = await getTokenState();
    expect(info4.token).toEqual(info.token);
    expect(info4.status).toEqual('scanned');
    expect(info4.currentStep).toEqual(0);

    const authInfo1 = Jwt.decode(info3.authInfo);
    const claim = authInfo1.requestedClaims[0];
    expect(claim.type).toEqual('authPrincipal');
    expect(claim.supervised).toEqual(true);

    // Submit auth principal
    await axios.post(
      authInfo1.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo1.challenge }),
      },
      { headers }
    );

    // Check store status: scanned
    const { data: info6 } = await getTokenState();
    expect(info6.token).toEqual(info.token);
    expect(info6.status).toEqual('scanned');
    expect(info6.currentStep).toEqual(0);

    // Continue to next workflow
    const getNextTokenState = () => axios.get(`${server.url}/api/did/connectOnly/status?_t_=${nextToken}`);

    // Simulate wallet scan
    const authUrl2 = decodeURIComponent(qs.parse(url.parse(nextWorkflow).search).url);
    const { data: info9 } = await axios.get(authUrl2, { headers });
    const authInfo4 = Jwt.decode(info9.authInfo);

    // Submit auth principal
    await axios.post(
      authInfo4.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo4.challenge }),
      },
      { headers }
    );

    const { data: info12 } = await getTokenState();
    expect(info12.token).toEqual(info.token);
    expect(info12.status).toEqual('succeed');
    const { data: info13 } = await getNextTokenState();
    expect(info13.token).toEqual(nextToken);
    expect(info13.status).toEqual('succeed');
  });

  test('should handle skippable authPrincipal + dynamic claim + nextWorkflow as expected', async () => {
    const tokenStorage = new MemoryAuthStorage();
    const authenticator = new Authenticator({
      wallet: app,
      baseUrl: server.url,
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
      },
    });
    const globalOnConnect = jest.fn();
    const handlers = new WalletHandlers({
      tokenStorage,
      authenticator,
      onConnect: globalOnConnect,
    });

    let nextWorkflow = null;
    let nextToken = null;

    handlers.attach({
      app: server,
      action: 'skippable',
      onConnect: () => {
        return {
          profile: () => ({
            fields: ['fullName', 'email'],
            description: 'test',
          }),
        };
      },

      // eslint-disable-next-line consistent-return
      onAuth: async () => {
        if (!nextToken) {
          const { data: info } = await axios.get(`${server.url}/api/did/skippable/token`, {
            headers: {
              Cookie: `connected_did=${user.address}`,
            },
          });
          nextWorkflow = info.url;
          nextToken = info.token;
          return { nextWorkflow, nextToken };
        }
      },
    });

    // Test api endpoint
    const { data: info } = await axios.get(`${server.url}/api/did/skippable/token`, {
      headers: {
        Cookie: `connected_did=${user.address}`,
      },
    });
    const getTokenState = () => axios.get(`${server.url}/api/did/skippable/status?_t_=${info.token}`);
    expect(info.token).toBeTruthy();
    expect(info.url.indexOf(info.token) > 0).toBeTruthy();

    // Parse auth url from wallet
    const parsed = url.parse(info.url);
    const authUrl = decodeURIComponent(qs.parse(parsed.search).url);
    expect(authUrl.indexOf(info.token) > 0).toBeTruthy();

    // Check token status
    const { data: info2 } = await getTokenState();
    expect(info2.token).toEqual(info.token);
    expect(info2.status).toEqual('created');
    expect(info2.currentStep).toEqual(0);

    // Simulate wallet scan
    const { data: info3 } = await axios.get(authUrl, { headers });
    expect(info3.appPk).toEqual(toBase58(app.publicKey));
    expect(Jwt.verify(info3.authInfo, info3.appPk)).toEqual(true);

    // Check token status
    const { data: info4 } = await getTokenState();
    expect(info4.token).toEqual(info.token);
    expect(info4.status).toEqual('scanned');
    expect(info4.currentStep).toEqual(0);

    const authInfo1 = Jwt.decode(info3.authInfo);
    const claim = authInfo1.requestedClaims[0];
    expect(claim.type).toEqual('authPrincipal');
    expect(claim.supervised).toEqual(false);

    // Submit auth principal
    const { data: info5 } = await axios.post(
      authInfo1.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo1.challenge }),
      },
      { headers }
    );
    const authInfo2 = Jwt.decode(info5.authInfo);

    // Submit profile claim
    const { data: info7 } = await axios.post(
      authInfo2.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
          challenge: authInfo2.challenge,
        }),
      },
      { headers }
    );
    const authInfo3 = Jwt.decode(info7.authInfo);
    expect(authInfo3.nextWorkflow).toEqual(nextWorkflow);
    expect(authInfo3.response.nextToken).toEqual(nextToken);

    const { data: info8 } = await getTokenState();
    expect(info8.token).toEqual(info.token);
    expect(info8.status).toEqual('scanned');

    // Continue to next workflow
    const getNextTokenState = () => axios.get(`${server.url}/api/did/skippable/status?_t_=${nextToken}`);

    // Simulate wallet scan
    const authUrl2 = decodeURIComponent(qs.parse(url.parse(nextWorkflow).search).url);
    const { data: info9 } = await axios.get(authUrl2, { headers });
    const authInfo4 = Jwt.decode(info9.authInfo);

    const { data: info10 } = await axios.post(
      authInfo4.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, { requestedClaims: [], challenge: authInfo4.challenge }),
      },
      { headers }
    );

    // Submit profile claim again
    const authInfo5 = Jwt.decode(info10.authInfo);
    const { data: info11 } = await axios.post(
      authInfo5.url,
      {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', email: 'shijun@arcblock.io', fullName: 'wangshijun' }],
          challenge: authInfo5.challenge,
        }),
      },
      { headers }
    );
    expect(info11).toBeTruthy();

    const { data: info12 } = await getTokenState();
    expect(info12.token).toEqual(info.token);
    expect(info12.status).toEqual('succeed');
    const { data: info13 } = await getNextTokenState();
    expect(info13.token).toEqual(nextToken);
    expect(info13.status).toEqual('succeed');

    expect(globalOnConnect.mock.calls.length).toEqual(8);
  });

  afterAll(async () => {
    await server.close();
  });
});
