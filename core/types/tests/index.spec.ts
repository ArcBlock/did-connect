import { Joi } from '@arcblock/validator';
import { ChainInfo, VerifiableCredentialRequest, Context, Session, AnyRequest } from '../src';

const session = {
  sessionId: '4V7cETiWKk3eimLMbe-WN',
  status: 'walletApproved',
  updaterPk: '0xf07be85738c438a00de66f5dbc31e3a912da990c3616d0f3ab89f89f0760379d',
  strategy: 'default',
  authUrl: 'http://localhost:65325/api/connect/relay/auth?sid=4V7cETiWKk3eimLMbe-WN',
  challenge: '0553621E72367FCCB1AF23836D65AB1B',
  autoConnect: true,
  onlyConnect: false,
  appInfo: {
    name: 'DID Wallet Demo',
    description: 'Demo application to show the potential of DID Wallet',
    icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
    link: 'http://localhost:65325',
    updateSubEndpoint: true,
    subscriptionEndpoint: '/api/websocket',
    nodeDid: 'z1Zg7PUWJX2NS9cRhpjuMtvjjLK5W2E3Wsh',
    publisher: 'did:abt:zNKstYf2LRbWeoACeb5Wz2xp3zgfS2fjpJ7U',
    path: 'https://abtwallet.io/i/',
  },
  previousConnected: null,
  currentConnected: {
    userDid: 'z1XYJehH21HVE3HLaHbysG13275qRGmSRQs',
    userPk: 'zBbUVsunnhEqMBK1VD4p26fBadA2nKAtdDyvQwLTQ5WU9',
    didwallet: { os: 'web', version: '3.0.0', jwt: '1.1.0' },
  },
  currentStep: 0,
  requestedClaims: [
    {
      type: 'profile',
      items: ['fullName', 'email', 'avatar'],
      description: 'Please give me your profile',
      meta: {},
    },
  ],
  responseClaims: [],
  approveResults: [],
  timeout: { app: 10000, relay: 10000, wallet: 60000 },
  error: '',
};

describe('Validator', () => {
  test('should chainInfo work', () => {
    expect(ChainInfo.validate({ host: 'none' }).error).toBeFalsy();
    expect(ChainInfo.validate({ host: 'none', id: 'none' }).error).toBeFalsy();
    expect(ChainInfo.validate({ host: 'https://beta.abtnetwork.io' }).error).toBeFalsy();
    expect(ChainInfo.validate({ host: 'https://beta.abtnetwork.io', id: 'beta' }).error).toBeFalsy();
  });

  test('should trusted issuers work', () => {
    const { error } = VerifiableCredentialRequest.validate({
      type: 'verifiableCredential',
      description: 'xxx',
      filters: [
        { trustedIssuers: ['z1Tp3bGid5Kwc1NygaBPdVVg6BuhJagF2G4'] },
        { trustedIssuers: [{ did: 'z1nUziGm98Rigq2ZoRQNyHd4Xw1KkVKCWE6', endpoint: 'https://arcblock.io' }] },
      ],
    });
    expect(error).toBeFalsy();
  });

  test('should Context work', () => {
    const context = {
      didwallet: { os: '', version: '', jwt: '1.0.0' },
      body: {
        sessionId: 'NK29_Qe-r1uDc5vuEHJlp',
        updaterPk: '0xe49ae11b98d1f96fb2868a4d95fc69048ff12c8b9be238b9d6260e93364bcb8a',
        authUrl: 'http://localhost:63348/api/connect/relay/auth?sid=NK29_Qe-r1uDc5vuEHJlp',
      },
      headers: {
        'x-updater-pk': '0xe49ae11b98d1f96fb2868a4d95fc69048ff12c8b9be238b9d6260e93364bcb8a',
        'x-updater-token': 'eyJhbGciOiJFZDI1NTE5IiwidHlwZSI6IkpXVCJ9',
        'user-agent': 'axios/0.27.2',
      },
      sessionId: '',
      locale: 'en',
      signerPk: '',
      signerToken: '',
      previousConnected: null,
    };
    expect(Context.validate({ ...context, session: null }).error).toBeFalsy();
    expect(Context.validate({ ...context, session }).error).toBeFalsy();
  });

  test('should Session work', () => {
    expect(Session.validate({ ...session }).error).toBeFalsy();
    expect(Session.validate({ ...session, requestedClaims: [] }).error).toBeFalsy();
    expect(Session.validate({ ...session, responseClaims: [session.requestedClaims] }).error).toBeFalsy();
  });

  test('should AnyRequest work', () => {
    expect(
      AnyRequest.validate({
        type: 'profile',
        items: ['fullName'],
        description: 'xxx',
      }).error
    ).toBeFalsy();

    const requestedClaims = Joi.array()
      .items(Joi.alternatives().try(Joi.array().items(AnyRequest).min(1), AnyRequest))
      .min(1)
      .required();

    expect(
      requestedClaims.validate({
        type: 'profile',
        items: ['fullName'],
        description: 'xxx',
      }).error
    ).toBeTruthy();

    expect(
      requestedClaims.validate([
        {
          type: 'profile',
          items: ['fullName'],
          description: 'xxx',
        },
      ]).error
    ).toBeFalsy();

    expect(
      requestedClaims.validate([
        {
          type: 'xxx',
          items: ['fullName'],
          description: 'xxx',
        },
      ]).error
    ).toBeTruthy();

    expect(
      requestedClaims.validate([
        [
          {
            type: 'profile',
            items: ['fullName'],
            description: 'xxx',
          },
        ],
      ]).error
    ).toBeFalsy();
  });
});
