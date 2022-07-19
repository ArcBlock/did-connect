/* eslint-disable prefer-spread */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable import/first */
/* eslint-disable import/no-extraneous-dependencies */
// @ts-ignore
import('node-localstorage/register'); // polyfill ls

import type {
  TSession,
  TEvent,
  TAuthResponse,
  TAnyObject,
  TAnyRequest,
  TAppResponse,
  TProfileRequest,
  TProfileResponse,
  TAssetRequest,
  TAssetResponse,
  TAuthPrincipalResponse,
  TAnyResponse,
} from '@did-connect/types';

import { types } from '@ocap/mcrypto';
import { fromRandom } from '@ocap/wallet';
import { interpret } from 'xstate';
import { nanoid } from 'nanoid';
import { Request, Response } from 'express';
import last from 'lodash/last';
import axios from 'axios';
import { sign, verify, decode } from '@arcblock/jwt';
import { toBase58 } from '@ocap/util';
import waitFor from 'p-wait-for';
// @ts-ignore
import joinUrl from 'url-join';

import { MemoryStorage } from '@did-connect/storage-memory';
import { Authenticator } from '@did-connect/authenticator';
import { createHandlers } from '@did-connect/handler';

// @ts-ignore
import { attachHandlers } from '@did-connect/relay-adapter-express';

// @ts-ignore
// eslint-disable-next-line import/no-relative-packages
import createTestServer from '../../../scripts/create-test-server';
import type { TApproveCallback, TConnectCallback, TEventCallback } from '../src/index';
import { createStateMachine, destroyConnections } from '../src/index';

// eslint-disable-next-line
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const Jwt = { sign, verify, decode };
const noop = () => {};
const user = fromRandom();
const app = fromRandom({ role: types.RoleType.ROLE_APPLICATION });

const profileRequest: TProfileRequest = {
  type: 'profile',
  items: ['fullName', 'email', 'avatar'],
  description: 'Please give me your profile',
};
const profileResponse: TProfileResponse = {
  type: 'profile',
  fullName: 'test',
  email: 'test@arcblock.io',
  avatar: 'abc',
};

const assetRequest: TAssetRequest = {
  type: 'asset',
  description: 'Please prove that you own asset',
  address: user.address,
};
const assetResponse: TAssetResponse = {
  type: 'asset',
  asset: user.address,
  ownerDid: user.address,
  ownerPk: user.publicKey.toString(),
  ownerProof: 'abc',
};

const storage = new MemoryStorage();
const authenticator = new Authenticator({
  wallet: app,
  appInfo: ({ baseUrl }: any) => ({
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

const getAuthUrl = (authUrl: string): string => {
  const obj = new URL(authUrl);
  obj.searchParams.set('user-agent', 'ArcWallet/3.0.0');
  return obj.href;
};

describe('StateMachine', () => {
  let server: any;
  let baseUrl: string;

  beforeAll(async () => {
    server = await createTestServer({
      routes: [
        {
          method: 'post',
          path: '/connect/error',
          handler: (req: Request, res: Response) => res.json({ error: 'connect error' }),
        },
        {
          method: 'post',
          path: '/connect/profile',
          handler: (req: Request, res: Response) => res.json([[profileRequest]]),
        },
        {
          method: 'get',
          path: '/approve/notfound',
          handler: (req: Request, res: Response) => res.json({ error: 'approve notfound' }),
        },
        {
          method: 'post',
          path: '/approve/profile',
          handler: (req: Request, res: Response) =>
            res.json({ successMessage: `approved with result ${req.body.responseClaims[0][0].fullName}` }),
        },
      ],
    });

    const logger = {
      // eslint-disable-next-line no-console
      info: process.env.CI ? noop : console.info,
      error: process.env.CI ? noop : console.error,
      warn: process.env.CI ? noop : console.warn,
      debug: noop,
    };
    const handlers = createHandlers({ storage, authenticator, logger });
    handlers.wsServer.attach(server.http);
    handlers.wsServer.attach(server.https);

    attachHandlers(server, handlers);

    baseUrl = server.url;
  });

  test('should throw on invalid sessionId', () => {
    // @ts-ignore
    expect(() => createStateMachine({ sessionId: 'abc' })).toThrow(/Invalid sessionId/);
    // @ts-ignore
    expect(() => createStateMachine({ dispatch: 'abc' })).toThrow(/Invalid dispatch/);
    // @ts-ignore
    expect(() => createStateMachine({ dispatch: noop })).toThrow(/Invalid onConnect/);
    // @ts-ignore
    expect(() => createStateMachine({ dispatch: noop, onConnect: 'abc' })).toThrow(/Invalid onConnect/);
    // @ts-ignore
    expect(() => createStateMachine({ dispatch: noop, onConnect: [[{ type: 'b' }]] })).toThrow(/Invalid onConnect/);
    // @ts-ignore
    expect(() => createStateMachine({ dispatch: noop, onApprove: noop })).toThrow(/Invalid onConnect/);
    // @ts-ignore
    expect(() => createStateMachine({ dispatch: noop, onConnect: noop })).toThrow(/Invalid onApprove/);
    // @ts-ignore
    expect(() => createStateMachine({ dispatch: noop, onConnect: noop, onApprove: 'abc' })).toThrow(
      /Invalid onApprove/
    );
    // @ts-ignore
    expect(() => createStateMachine({ dispatch: noop, onConnect: noop, onApprove: 123 })).toThrow(/Invalid onApprove/);
  });

  const defaultConnectHandler = (authInfo: TAuthResponse): [TAnyRequest[], string, string] => {
    expect(authInfo.requestedClaims[0].type).toEqual('profile');
    const claims = authInfo.requestedClaims;
    const { challenge } = authInfo;
    const nextUrl = authInfo.url;
    return [claims, challenge, nextUrl];
  };

  const defaultApproveHandler = (ctx: TSession, e: TEvent): TAppResponse => {
    const response = e.responseClaims[0] as TProfileResponse;
    return { successMessage: `approved with result ${response.fullName}` };
  };

  const defaultCompleteHandler = (ctx: TSession) => {
    expect(ctx.requestedClaims.length).toBe(1);
    expect(ctx.requestedClaims[0].length).toBe(1);
    expect(ctx.responseClaims.length).toBe(1);
    expect(ctx.responseClaims[0].length).toBe(1);
    expect(ctx.approveResults.length).toBe(1);

    expect(ctx.requestedClaims[0][0].type).toEqual('profile');
    expect(ctx.responseClaims[0][0].type).toEqual('profile');
    expect(ctx.approveResults[0].successMessage).toEqual(
      `approved with result ${(ctx.responseClaims[0][0] as TProfileResponse).fullName}`
    );
  };

  const runSingleTest = async ({
    sessionProps = {},
    handleWalletConnect = defaultConnectHandler,
    onConnect,
    onApprove = defaultApproveHandler,
    onComplete = defaultCompleteHandler,
    requestedClaims = [profileResponse],
    expectedStatusHistory = [
      'start',
      'loading',
      'created',
      'walletScanned',
      'walletConnected',
      'appConnected',
      'walletApproved',
      'appApproved',
      'completed',
    ],
  }: {
    sessionProps?: any;
    handleWalletConnect?: (authInfo: TAuthResponse) => [TAnyRequest[], string, string];
    onConnect?: TConnectCallback | TAnyRequest[][] | string;
    onApprove?: TApproveCallback | string;
    onComplete?: TEventCallback;
    requestedClaims?: TAnyResponse[];
    expectedStatusHistory?: string[];
  }) => {
    let res: TAnyObject;
    let authInfo: any;

    const stateHistory: string[] = [];

    const { machine } = createStateMachine({
      relayUrl: joinUrl(baseUrl, '/api/connect/relay'),
      // @ts-ignore
      dispatch: (...args: any[]) => service.send.apply(service, args),
      ...sessionProps,
      onConnect,
      onApprove,
      onComplete,
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      if (state.value === 'created') {
        expect(state.context.appInfo).toBeTruthy();
      }
      if (state.changed !== false) {
        stateHistory.push(state.value as string);
      }
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
      if (claims.find((x: TAnyRequest) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey as string, {
            requestedClaims: [],
            challenge: authInfo.challenge,
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        [claims, challenge, nextUrl] = await handleWalletConnect(authInfo);
      }

      if (nextUrl) {
        res = await axios.post(nextUrl, {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey as string, {
            requestedClaims,
            challenge,
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.status).toEqual('ok');
      }
    } catch (err) {
      console.error(err);
      expect(err).toBeFalsy();
    }

    await waitFor(() => last(stateHistory) === 'completed');
    expect(stateHistory).toEqual(expectedStatusHistory);
    service.stop();
  };

  test('should work as expected: 1 claim + 1 step', async () => {
    await runSingleTest({
      onConnect: () => {
        return [[profileRequest]];
      },
    });
  });

  test('should work as expected: 1 claim + 1 step + connectUrl', async () => {
    await runSingleTest({
      onConnect: joinUrl(baseUrl, '/connect/profile'),
    });
  });

  test('should work as expected: 1 claim + 1 step + connectUrl + approveUrl', async () => {
    await runSingleTest({
      onConnect: joinUrl(baseUrl, '/connect/profile'),
      onApprove: joinUrl(baseUrl, '/approve/profile'),
    });
  });

  test('should work as expected: multiple claims + 1 step', async () => {
    await runSingleTest({
      requestedClaims: [profileResponse, assetResponse],
      onConnect: () => {
        return [[profileRequest, assetRequest]];
      },
      onApprove: (ctx: TSession, e: TEvent) => {
        return {
          successMessage: `you connected account ${ctx.currentConnected?.userDid} and provided asset ${
            (e.responseClaims[1] as TAssetResponse).asset
          }`,
        };
      },
      onComplete: (ctx: TSession) => {
        expect(ctx.requestedClaims.length).toBe(1);
        expect(ctx.requestedClaims[0].length).toBe(2);
        expect(ctx.responseClaims.length).toBe(1);
        expect(ctx.responseClaims[0].length).toBe(2);
        expect(ctx.approveResults.length).toBe(1);
      },
    });
  });

  test('should work as expected: 1 claim + 1 step + pre-populate', async () => {
    await runSingleTest({
      onConnect: [[profileRequest]],
    });
  });

  test('should work as expected: connect only', async () => {
    await runSingleTest({
      sessionProps: { onlyConnect: true },
      handleWalletConnect: (authInfo) => {
        expect(authInfo.status).toEqual('ok');
        expect(authInfo.successMessage).toMatch('you connected account');
        return [[], '', ''];
      },
      onConnect: () => [],
      onApprove: (ctx: TSession, e: TEvent) => {
        return { successMessage: `you connected account ${(e.responseClaims[0] as TAuthPrincipalResponse).userDid}` };
      },
      onComplete: noop,
      expectedStatusHistory: [
        'start',
        'loading',
        'created',
        'walletScanned',
        'walletConnected',
        'walletApproved',
        'appApproved',
        'completed',
      ],
    });
  });

  const runMultiStepTest = async ({ onConnect }: any) => {
    let res: TAnyObject;
    let authInfo: any;
    let currentStep: number;

    const stateHistory: string[] = [];

    const { machine } = createStateMachine({
      relayUrl: joinUrl(baseUrl, '/api/connect/relay'),
      // @ts-ignore
      dispatch: (...args: any[]) => service.send.apply(service, args),
      onConnect,
      onApprove: (ctx: TSession, e: TEvent) => {
        currentStep = e.currentStep;
        if (e.currentStep === 0) {
          return { successMessage: `approved with profile ${(e.responseClaims[0] as TProfileResponse).fullName}` };
        }

        return { successMessage: `approved with asset ${(e.responseClaims[0] as TAssetResponse).asset}` };
      },

      // eslint-disable-next-line no-unused-vars
      onComplete: (ctx: TSession) => {
        expect(ctx.requestedClaims.length).toBe(2);
        expect(ctx.responseClaims.length).toBe(2);
        expect(ctx.responseClaims[0].length).toBe(1);
        expect(ctx.responseClaims[1].length).toBe(1);
        expect(ctx.approveResults.length).toBe(2);

        expect(ctx.requestedClaims[0][0].type).toEqual('profile');
        expect(ctx.requestedClaims[1][0].type).toEqual('asset');
        expect(ctx.responseClaims[0][0].type).toEqual('profile');
        expect(ctx.responseClaims[1][0].type).toEqual('asset');
        expect(ctx.approveResults[0].successMessage).toEqual(
          `approved with profile ${(ctx.responseClaims[0][0] as TProfileResponse).fullName}`
        );
        expect(ctx.approveResults[1].successMessage).toEqual(
          `approved with asset ${(ctx.responseClaims[1][0] as TAssetResponse).asset}`
        );
      },
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      if (state.value === 'created') {
        expect(state.context.appInfo).toBeTruthy();
      }
      if (state.changed !== false) {
        stateHistory.push(state.value as string);
      }
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
      if (claims.find((x: TAnyRequest) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey as string, {
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
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [profileResponse],
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
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [assetResponse],
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
      onConnect: () => {
        return [[profileRequest], [assetRequest]];
      },
    });
  });

  test('should work as expected: 1 claim + 2 steps + pre-populated', async () => {
    await runMultiStepTest({
      onConnect: [[profileRequest], [assetRequest]],
    });
  });

  test('should abort session when challenge mismatch', async () => {
    let res: TAnyObject;
    let authInfo: any;

    const stateHistory: string[] = [];

    const { machine } = createStateMachine({
      relayUrl: joinUrl(baseUrl, '/api/connect/relay'),
      // @ts-ignore
      dispatch: (...args: any[]) => service.send.apply(service, args),
      onConnect: () => [],
      onApprove: () => ({}),
      onComplete: () => {},
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      if (state.changed !== false) {
        stateHistory.push(state.value as string);
      }
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
      if (claims.find((x: TAnyRequest) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey as string, {
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
    let res: TAnyObject;
    let authInfo: any;

    const stateHistory: string[] = [];

    const { machine } = createStateMachine({
      relayUrl: joinUrl(baseUrl, '/api/connect/relay'),
      // @ts-ignore
      dispatch: (...args: any[]) => service.send.apply(service, args),
      onConnect: () => [],
      onApprove: () => ({}),
      onComplete: () => {},
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      if (state.changed !== false) {
        stateHistory.push(state.value as string);
      }
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
      if (claims.find((x: TAnyRequest) => x.type === 'authPrincipal')) {
        const nextUrl = getAuthUrl(authInfo.url);
        res = await axios.post(nextUrl, {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey as string, {
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
    let res: TAnyObject;
    let authInfo: any;

    const stateHistory: string[] = [];

    const { machine } = createStateMachine({
      relayUrl: joinUrl(baseUrl, '/api/connect/relay'),
      // @ts-ignore
      dispatch: (...args: any[]) => service.send.apply(service, args),
      onConnect: () => {
        throw new Error('onConnect error');
      },
      onApprove: () => ({}),
      onComplete: () => {},
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      if (state.changed !== false) {
        stateHistory.push(state.value as string);
      }
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
      if (claims.find((x: TAnyRequest) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey as string, {
            requestedClaims: [],
            challenge: authInfo.challenge,
          }),
        });
        authInfo = Jwt.decode(res.data.authInfo);
        expect(authInfo.requestedClaims).toBeFalsy();
        expect(authInfo.status).toEqual('error');
        expect(authInfo.errorMessage).toMatch('onConnect error');
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
    let res: TAnyObject;
    let authInfo: any;
    let hasError = false;

    const stateHistory: string[] = [];

    const { machine } = createStateMachine({
      relayUrl: joinUrl(baseUrl, '/api/connect/relay'),
      // @ts-ignore
      dispatch: (...args: any[]) => service.send.apply(service, args),
      onConnect: () => {
        return [[profileRequest]];
      },
      onApprove: () => {
        throw new Error('onApprove error');
      },
      onComplete: () => {},
      onError: () => {
        hasError = true;
      },
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      if (state.changed !== false) {
        stateHistory.push(state.value as string);
      }
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
      if (claims.find((x: TAnyRequest) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey as string, {
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
        userInfo: Jwt.sign(user.address, user.secretKey as string, {
          requestedClaims: [profileResponse],
          challenge,
        }),
      });
      authInfo = Jwt.decode(res.data.authInfo);
      expect(authInfo.status).toEqual('error');
      expect(authInfo.errorMessage).toMatch('onApprove error');
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

  let finalizedSessionId: string = '';
  test('should abort session when app canceled', async () => {
    let res: TAnyObject;
    let authInfo: any;
    let hasCanceled = false;

    const stateHistory: string[] = [];

    const { machine } = createStateMachine({
      relayUrl: joinUrl(baseUrl, '/api/connect/relay'),
      // @ts-ignore
      dispatch: (...args: any[]) => service.send.apply(service, args),
      onConnect: (ctx, e) => {
        expect(e.type).toBe('WALLET_CONNECTED');
        // @ts-ignore
        service.send({ type: 'CANCEL' });
        return [];
      },
      onApprove: () => ({}),
      onComplete: () => {},
      onCancel: (ctx, e) => {
        expect(e.type).toBe('CANCEL');
        hasCanceled = true;
      },
    });

    const initial = machine.initialState;
    const service = interpret(machine).onTransition((state) => {
      if (state.changed !== false) {
        stateHistory.push(state.value as string);
      }
    });

    finalizedSessionId = initial.context.sessionId;

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
      if (claims.find((x: TAnyRequest) => x.type === 'authPrincipal')) {
        res = await axios.post(getAuthUrl(authInfo.url), {
          userPk: toBase58(user.publicKey),
          userInfo: Jwt.sign(user.address, user.secretKey as string, {
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

  test('should abort session when reuse non-existing session', async () => {
    const stateHistory: string[] = [];
    const nonExistingSession = nanoid();
    let hasError = false;
    const { machine } = createStateMachine({
      relayUrl: joinUrl(baseUrl, '/api/connect/relay'),
      sessionId: nonExistingSession,
      // @ts-ignore
      dispatch: (...args: any[]) => service.send.apply(service, args),
      onConnect: () => [],
      onApprove: () => ({}),
      onError: () => {
        hasError = true;
      },
    });

    const service = interpret(machine).onTransition((state) => {
      if (state.changed !== false) {
        stateHistory.push(state.value as string);
      }
    });

    // Start the service and wait for session created
    service.start();
    await waitFor(() => last(stateHistory) === 'error');
    await waitFor(() => hasError === true);
    expect(stateHistory).toEqual(['start', 'loading', 'error']);
    service.stop();
  });

  test('should abort session when reuse finalized session', async () => {
    const stateHistory: string[] = [];
    let hasError = false;
    const { machine } = createStateMachine({
      relayUrl: joinUrl(baseUrl, '/api/connect/relay'),
      sessionId: finalizedSessionId,
      // @ts-ignore
      dispatch: (...args: any[]) => service.send.apply(service, args),
      onConnect: () => [],
      onApprove: () => ({}),
      onError: (ctx, e) => {
        expect(e.data.code).toBe('INVALID_SESSION');
        hasError = true;
      },
    });

    const service = interpret(machine).onTransition((state) => {
      if (state.changed !== false) {
        stateHistory.push(state.value as string);
      }
    });

    // Start the service and wait for session created
    service.start();
    await waitFor(() => last(stateHistory) === 'error');
    await waitFor(() => hasError === true);
    expect(stateHistory).toEqual(['start', 'loading', 'error']);
    service.stop();
  });

  afterAll(async () => {
    await sleep(200);
    // CAUTION: socket client disconnect should be called before server shutdown
    destroyConnections();
    await server.close();
  });
});
