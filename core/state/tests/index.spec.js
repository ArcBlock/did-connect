/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
require('node-localstorage/register'); // polyfill ls
const { types } = require('@ocap/mcrypto');
const { fromRandom } = require('@ocap/wallet');
const { interpret } = require('xstate');
const last = require('lodash/last');
const pick = require('lodash/pick');
const axios = require('axios');
const Jwt = require('@arcblock/jwt');
const { toBase58 } = require('@ocap/util');
const waitFor = require('p-wait-for');
const joinUrl = require('url-join');

const MemoryStorage = require('@did-connect/storage-memory');
const Authenticator = require('@did-connect/authenticator');
const createHandlers = require('@did-connect/handler');
const attachHandlers = require('@did-connect/relay-adapter-express');

const createTestServer = require('../../../scripts/create-test-server');
const { createMachine, destroyConnections } = require('..');

const noop = () => null;
const user = fromRandom();
const app = fromRandom({ role: types.RoleType.ROLE_APPLICATION });

const storage = new MemoryStorage();
const authenticator = new Authenticator({
  wallet: app,
  appInfo: ({ baseUrl }) => ({
    name: 'DID Wallet Demo',
    description: 'Demo application to show the potential of DID Wallet',
    icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
    link: baseUrl,
    updateSubEndpoint: true,
    subscriptionEndpoint: '/api/websocket',
    nodeDid: 'z1Zg7PUWJX2NS9cRhpjuMtvjjLK5W2E3Wsh',
  }),
  chainInfo: {
    host: 'https://beta.abtnetwork.io/api',
    id: 'beta',
  },
});

const getAuthUrl = (authUrl) => {
  const obj = new URL(authUrl);
  obj.searchParams.set('user-agent', 'ArcWallet/3.0.0');
  return obj.href;
};

describe('StateMachine', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    server = await createTestServer();

    // eslint-disable-next-line no-console
    const logger = { info: console.info, error: console.error, warn: console.warn, debug: noop };
    const handlers = createHandlers({ storage, authenticator, logger, timeout: 1000 });
    handlers.wsServer.attach(server.http);
    handlers.wsServer.attach(server.https);

    attachHandlers(server, handlers);

    baseUrl = server.url;
  });

  test('should throw on invalid sessionId', () => {
    expect(() => createMachine({ sessionId: 'abc' })).toThrow(/Invalid sessionId/);
    expect(() => createMachine({ dispatch: 'abc' })).toThrow(/Invalid dispatch/);
    expect(() => createMachine({ dispatch: noop })).toThrow(/Invalid onApprove/);
    expect(() => createMachine({ dispatch: noop, onApprove: noop })).toThrow(/Invalid onConnect/);
  });

  const runSingleTest = async ({ onConnect }) => {
    let res;
    let authInfo;

    const stateHistory = [];

    const { machine } = createMachine({
      baseUrl: joinUrl(baseUrl, '/api/connect/relay'),
      dispatch: (...args) => service.send.call(service, ...args),
      onConnect,
      onApprove: (ctx, e) => {
        return `approved with result ${e.responseClaims[0].fullName}`;
      },
      onComplete: (ctx) => {
        expect(ctx.requestedClaims.length).toBe(1);
        expect(ctx.responseClaims.length).toBe(1);
        expect(ctx.responseClaims[0].length).toBe(1);
        expect(ctx.approveResults.length).toBe(1);

        expect(ctx.requestedClaims[0].type).toEqual('profile');
        expect(ctx.responseClaims[0][0].type).toEqual('profile');
        expect(ctx.approveResults[0]).toEqual(`approved with result ${ctx.responseClaims[0][0].fullName}`);
      },
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      if (state.value === 'created') {
        expect(state.context.appInfo).toBeTruthy();
      }
      stateHistory.push(state.value);
    });

    // Start the service and wait for session created
    service.start();
    await waitFor(() => last(stateHistory) === 'created');

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${initial.context.sessionId}`);

    // 2. simulate scan
    try {
      res = await axios.get(getAuthUrl(authUrl));
      expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
      expect(authInfo.url).toEqual(authUrl);

      // 3. submit auth principal
      let claims = authInfo.requestedClaims;
      let nextUrl = getAuthUrl(authUrl);
      let challenge = authInfo.challenge; // eslint-disable-line
      if (claims.find((x) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey, {
            requestedClaims: [],
            challenge: authInfo.challenge,
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.requestedClaims[0].type).toEqual('profile');
        claims = authInfo.requestedClaims;
        challenge = authInfo.challenge;
        nextUrl = authInfo.url;
      }

      res = await axios.post(nextUrl, {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
          challenge,
        }),
      });
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('ok');
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    await waitFor(() => last(stateHistory) === 'completed');
    expect(stateHistory).toEqual([
      'start',
      'loading',
      'created',
      'walletScanned',
      'walletConnected',
      'appConnected',
      'walletApproved',
      'appApproved',
      'completed',
    ]);
    service.stop();
  };

  test('should work as expected: 1 claim + 1 step', async () => {
    await runSingleTest({
      onConnect: (ctx, e) => {
        return [
          {
            type: 'profile',
            fields: ['fullName', 'email', 'avatar'],
            description: `Please give me your profile for ${e.currentConnected.userDid}`,
          },
        ];
      },
    });
  }, 10000);

  test('should work as expected: 1 claim + 1 step + pre-populate', async () => {
    await runSingleTest({
      onConnect: [
        {
          type: 'profile',
          fields: ['fullName', 'email', 'avatar'],
          description: 'Please give me your profile',
        },
      ],
    });
  }, 10000);

  const runMultiStepTest = async ({ onConnect }) => {
    let res;
    let authInfo;
    let currentStep;

    const stateHistory = [];

    const { machine } = createMachine({
      baseUrl: joinUrl(baseUrl, '/api/connect/relay'),
      dispatch: (...args) => service.send.call(service, ...args),
      onConnect,

      onApprove: (ctx, e) => {
        currentStep = e.currentStep;
        if (e.currentStep === 0) {
          return `approved with profile ${e.responseClaims[0].fullName}`;
        }

        return `approved with asset ${e.responseClaims[0].address}`;
      },

      // eslint-disable-next-line no-unused-vars
      onComplete: (ctx, e) => {
        expect(ctx.requestedClaims.length).toBe(2);
        expect(ctx.responseClaims.length).toBe(2);
        expect(ctx.responseClaims[0].length).toBe(1);
        expect(ctx.responseClaims[1].length).toBe(1);
        expect(ctx.approveResults.length).toBe(2);

        expect(ctx.requestedClaims[0].type).toEqual('profile');
        expect(ctx.requestedClaims[1].type).toEqual('asset');
        expect(ctx.responseClaims[0][0].type).toEqual('profile');
        expect(ctx.responseClaims[1][0].type).toEqual('asset');
        expect(ctx.approveResults[0]).toEqual(`approved with profile ${ctx.responseClaims[0][0].fullName}`);
        expect(ctx.approveResults[1]).toEqual(`approved with asset ${ctx.responseClaims[1][0].address}`);
      },
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      if (state.value === 'created') {
        expect(state.context.appInfo).toBeTruthy();
      }
      stateHistory.push(state.value);
    });

    // Start the service and wait for session created
    service.start();
    await waitFor(() => last(stateHistory) === 'created');

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${initial.context.sessionId}`);

    // 2. simulate scan
    try {
      res = await axios.get(getAuthUrl(authUrl));
      expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
      expect(authInfo.url).toEqual(authUrl);

      // 3. submit auth principal
      let claims = authInfo.requestedClaims;
      let nextUrl = getAuthUrl(authUrl);
      let challenge = authInfo.challenge; // eslint-disable-line
      if (claims.find((x) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey, {
            requestedClaims: [],
            challenge: authInfo.challenge,
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.requestedClaims[0].type).toEqual('profile');
        claims = authInfo.requestedClaims;
        challenge = authInfo.challenge;
        nextUrl = authInfo.url;
      }

      // 4. submit profile claim: return asset claim
      res = await axios.post(nextUrl, {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
          challenge,
        }),
      });
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('asset');
      claims = authInfo.requestedClaims;
      challenge = authInfo.challenge;
      nextUrl = authInfo.url;

      await waitFor(() => currentStep === 0);

      // 5. submit asset claim
      res = await axios.post(nextUrl, {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'asset', address: user.address }],
          challenge,
        }),
      });
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('ok');
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    await waitFor(() => last(stateHistory) === 'completed');
    expect(stateHistory).toEqual([
      'start',
      'loading',
      'created',
      'walletScanned',
      'walletConnected',
      'appConnected',
      'walletApproved',
      'appApproved',
      'walletApproved',
      'appApproved',
      'completed',
    ]);
    service.stop();
  };

  test('should work as expected: 1 claim + 2 steps', async () => {
    await runMultiStepTest({
      onConnect: (ctx, e) => {
        return [
          {
            type: 'profile',
            fields: ['fullName', 'email', 'avatar'],
            description: `Please give me your profile for ${e.currentConnected.userDid}`,
          },
          {
            type: 'asset',
            description: 'Please prove that you own asset',
            target: user.address,
          },
        ];
      },
    });
  }, 10000);

  test('should work as expected: 1 claim + 2 steps + pre-populated', async () => {
    await runMultiStepTest({
      onConnect: [
        {
          type: 'profile',
          fields: ['fullName', 'email', 'avatar'],
          description: 'Please give me your profile',
        },
        {
          type: 'asset',
          description: 'Please prove that you own asset',
          target: user.address,
        },
      ],
    });
  }, 10000);

  test('should abort session when challenge mismatch', async () => {
    let res;
    let authInfo;

    const stateHistory = [];

    const { machine } = createMachine({
      baseUrl: joinUrl(baseUrl, '/api/connect/relay'),
      dispatch: (...args) => service.send.call(service, ...args),
      onConnect: (ctx, e) => {},
      onApprove: (ctx, e) => {},
      onComplete: (ctx, e) => {},
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      stateHistory.push(state.value);
    });

    // Start the service and wait for session created
    service.start();
    await waitFor(() => last(stateHistory) === 'created');

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${initial.context.sessionId}`);

    // 2. simulate scan
    try {
      res = await axios.get(getAuthUrl(authUrl));
      expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
      expect(authInfo.url).toEqual(authUrl);

      // 3. submit auth principal
      const claims = authInfo.requestedClaims;
      if (claims.find((x) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey, {
            requestedClaims: [],
            challenge: 'abcd',
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.status).toEqual('error');
        expect(authInfo.errorMessage).toEqual('Challenge mismatch');
      }
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    await waitFor(() => last(stateHistory) === 'error');
    expect(stateHistory).toEqual(['start', 'loading', 'created', 'walletScanned', 'error']);
    service.stop();
  });

  test('should abort session when wallet rejected', async () => {
    let res;
    let authInfo;

    const stateHistory = [];

    const { machine } = createMachine({
      baseUrl: joinUrl(baseUrl, '/api/connect/relay'),
      dispatch: (...args) => service.send.call(service, ...args),
      onConnect: (ctx, e) => {},
      onApprove: (ctx, e) => {},
      onComplete: (ctx, e) => {},
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      stateHistory.push(state.value);
    });

    // Start the service and wait for session created
    service.start();
    await waitFor(() => last(stateHistory) === 'created');

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${initial.context.sessionId}`);

    // 2. simulate scan
    try {
      res = await axios.get(getAuthUrl(authUrl));
      expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
      expect(authInfo.url).toEqual(authUrl);

      // 3. submit auth principal
      const claims = authInfo.requestedClaims;
      if (claims.find((x) => x.type === 'authPrincipal')) {
        const nextUrl = getAuthUrl(authInfo.url);
        res = await axios.post(nextUrl, {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey, {
            action: 'declineAuth',
            requestedClaims: [],
            challenge: authInfo.challenge,
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.requestedClaims).toBeFalsy();
      }
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    await waitFor(() => last(stateHistory) === 'rejected');
    expect(stateHistory).toEqual(['start', 'loading', 'created', 'walletScanned', 'rejected']);
    service.stop();
  });

  test('should abort session when onConnect throws', async () => {
    let res;
    let authInfo;

    const stateHistory = [];

    const { machine } = createMachine({
      baseUrl: joinUrl(baseUrl, '/api/connect/relay'),
      dispatch: (...args) => service.send.call(service, ...args),
      onConnect: (ctx, e) => {
        throw new Error('onConnect error');
      },
      onApprove: (ctx, e) => {},
      onComplete: (ctx, e) => {},
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      stateHistory.push(state.value);
    });

    // Start the service and wait for session created
    service.start();
    await waitFor(() => last(stateHistory) === 'created');

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${initial.context.sessionId}`);

    // 2. simulate scan
    try {
      res = await axios.get(getAuthUrl(authUrl));
      expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
      expect(authInfo.url).toEqual(authUrl);

      // 3. submit auth principal
      const claims = authInfo.requestedClaims;
      if (claims.find((x) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey, {
            requestedClaims: [],
            challenge: authInfo.challenge,
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.requestedClaims).toBeFalsy();
        expect(authInfo.status).toEqual('error');
        expect(authInfo.errorMessage).toEqual('onConnect error');
      }
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    await waitFor(() => last(stateHistory) === 'error');
    expect(stateHistory).toEqual(['start', 'loading', 'created', 'walletScanned', 'walletConnected', 'error']);
    service.stop();
  });

  test('should abort session when onApprove throws', async () => {
    let res;
    let authInfo;
    let hasError = false;

    const stateHistory = [];

    const { machine } = createMachine({
      baseUrl: joinUrl(baseUrl, '/api/connect/relay'),
      dispatch: (...args) => service.send.call(service, ...args),
      onConnect: (ctx, e) => {
        return [
          {
            type: 'profile',
            fields: ['fullName', 'email', 'avatar'],
            description: `Please give me your profile for ${e.currentConnected.userDid}`,
          },
        ];
      },
      onApprove: (ctx, e) => {
        throw new Error('onApprove error');
      },
      onComplete: (ctx, e) => {},
      onError: (ctx, e) => {
        hasError = true;
      },
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      stateHistory.push(state.value);
    });

    // Start the service and wait for session created
    service.start();
    await waitFor(() => last(stateHistory) === 'created');

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${initial.context.sessionId}`);

    // 2. simulate scan
    try {
      res = await axios.get(getAuthUrl(authUrl));
      expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
      expect(authInfo.url).toEqual(authUrl);

      // 3. submit auth principal
      let claims = authInfo.requestedClaims;
      let nextUrl = getAuthUrl(authUrl);
      let challenge = authInfo.challenge; // eslint-disable-line
      if (claims.find((x) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey, {
            requestedClaims: [],
            challenge,
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.requestedClaims[0].type).toBe('profile');
        claims = authInfo.requestedClaims;
        challenge = authInfo.challenge;
        nextUrl = authInfo.url;
      }

      res = await axios.post(nextUrl, {
        userPk: toBase58(user.publicKey),
        userInfo: Jwt.sign(user.address, user.secretKey, {
          requestedClaims: [{ type: 'profile', fullName: 'test', email: 'test@arcblock.io' }],
          challenge,
        }),
      });
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('error');
      expect(authInfo.errorMessage).toEqual('onApprove error');
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    await waitFor(() => last(stateHistory) === 'error');
    expect(stateHistory).toEqual([
      'start',
      'loading',
      'created',
      'walletScanned',
      'walletConnected',
      'appConnected',
      'walletApproved',
      'error',
    ]);
    expect(hasError).toBe(true);
    service.stop();
  });

  test('should abort session when app canceled', async () => {
    let res;
    let authInfo;
    let hasCanceled = false;

    const stateHistory = [];

    const { machine } = createMachine({
      baseUrl: joinUrl(baseUrl, '/api/connect/relay'),
      dispatch: (...args) => service.send.call(service, ...args),
      onConnect: (ctx, e) => {
        service.send({ type: 'CANCEL' });
      },
      onApprove: (ctx, e) => {},
      onComplete: (ctx, e) => {},
      onCancel: (ctx, e) => {
        hasCanceled = true;
      },
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      stateHistory.push(state.value);
    });

    // Start the service and wait for session created
    service.start();
    await waitFor(() => last(stateHistory) === 'created');

    const authUrl = joinUrl(baseUrl, `/api/connect/relay/auth?sid=${initial.context.sessionId}`);

    // 2. simulate scan
    try {
      res = await axios.get(getAuthUrl(authUrl));
      expect(Jwt.verify(res.data.authInfo, res.data.appPk)).toBe(true);
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.requestedClaims[0].type).toEqual('authPrincipal');
      expect(authInfo.url).toEqual(authUrl);

      // 3. submit auth principal
      const claims = authInfo.requestedClaims;
      if (claims.find((x) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey, {
            requestedClaims: [],
            challenge: authInfo.challenge,
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.status).toEqual('error');
        expect(authInfo.errorMessage).toMatch('canceled');
      }
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    await waitFor(() => last(stateHistory) === 'canceled');
    expect(stateHistory).toEqual(['start', 'loading', 'created', 'walletScanned', 'walletConnected', 'canceled']);
    expect(hasCanceled).toBe(true);
    service.stop();
  });

  afterAll(async () => {
    // CAUTION: socket client disconnect should be called before server shutdown
    destroyConnections();
    await server.close();
  });
});
