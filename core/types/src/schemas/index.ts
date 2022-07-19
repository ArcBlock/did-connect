// TODO: make enum values in schema to LiteralUnion for better DX
import { ObjectSchema } from 'joi';
import { Joi } from '@arcblock/validator';
import { types } from '@ocap/mcrypto';
import type { LiteralUnion } from 'type-fest';

// shared schema options
const options = { stripUnknown: true, noDefaults: false };
const capitalize = (input: string): string => input.charAt(0).toUpperCase() + input.slice(1);

type TLocaleCode = LiteralUnion<'en' | 'zh', string>;
type TSessionStatus = LiteralUnion<'start' | 'created' | 'walletScanned' | 'walletConnected' | 'appConnected' | 'walletApproved' | 'appApproved' | 'error' | 'timeout' | 'rejected' | 'canceled' | 'completed', string>; // prettier-ignore

// Basic Types
const ChainInfo: ObjectSchema = Joi.object({
  id: Joi.string().optional(),
  host: Joi.alternatives().try(
    Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
    Joi.string().valid('none').required()
  ),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'TChainInfo' });

const AppInfo: ObjectSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  icon: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  link: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  path: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('https://abtwallet.io/i/'),
  publisher: Joi.string().optional(),
  updateSubEndpoint: Joi.boolean().optional(),
  subscriptionEndpoint: Joi.string().optional(),
  nodeDid: Joi.DID().optional(),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'TAppInfo' });

const DIDWalletInfo = Joi.object({
  os: Joi.string().valid('ios', 'android', 'web').allow('').required(),
  version: Joi.string().required().allow(''),
  jwt: Joi.string().required(),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'TWalletInfo' });

// did-connect claim type utils
type TRequest = LiteralUnion<'authPrincipal' | 'profile' | 'signature' | 'prepareTx' | 'agreement' | 'verifiableCredential' | 'asset', string>; // prettier-ignore
type TSignature = LiteralUnion<'fg:g:transaction' | 'eth:transaction' | 'mime:text/html' | 'mime:text/plain', string>; // prettier-ignore

const createStandardFields = (type: string, description: string, isRequest: boolean) => {
  if (isRequest) {
    return {
      type: Joi.string().valid(type).required(),
      description: Joi.string().min(1).required().default(description),
      chainInfo: ChainInfo,
      meta: Joi.any().optional().default({}),
    };
  }

  return {
    type: Joi.string().valid(type).required(),
    meta: Joi.any().optional().default({}),
  };
};

const TrustedIssuer = Joi.alternatives().try(
  Joi.object({
    did: Joi.DID().required(),
    endpoint: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
  }),
  Joi.DID().required()
);
const createClaimTypes = (type: TRequest, description: string): ObjectSchema[] => {
  const claims: { [key in TRequest]: { request: any; response: any } } = {
    authPrincipal: {
      request: {
        target: Joi.DID().optional().allow('').default(''),
        targetType: Joi.object({
          key: Joi.string()
            .valid(...Object.keys(types.KeyType).map((x) => x.toLowerCase()))
            .required(),
          hash: Joi.string()
            .valid(...Object.keys(types.HashType).map((x) => x.toLowerCase()))
            .required(),
          role: Joi.string()
            .valid(...Object.keys(types.RoleType).map((x) => x.toLowerCase().split('_').pop()))
            .required(),
        }).optional(),
        declareParams: Joi.object({
          moniker: Joi.string().required(),
          issuer: Joi.DID().required(),
        }).optional(),
        supervised: Joi.boolean().default(false),
      },
      response: {
        userDid: Joi.DID().required(),
        userPk: Joi.string().required(),
      },
    },
    profile: {
      request: {
        items: Joi.array()
          .items(Joi.string().valid('fullName', 'email', 'phone', 'signature', 'avatar', 'birthday'))
          .min(1)
          .default(['fullName']),
      },
      response: {
        fullName: Joi.string().optional(),
        email: Joi.string().optional(),
        phone: Joi.string().optional(),
        avatar: Joi.string().optional(),
        signature: Joi.string().optional(),
        birthday: Joi.string().optional(),
      },
    },
    signature: {
      request: {
        typeUrl: Joi.string()
          .valid('fg:t:transaction', 'mime:text/plain', 'mime:text/html', 'eth:transaction')
          .required(),
        display: Joi.string().allow('').default(''),
        method: Joi.string()
          .allow('none', ...Object.keys(types.HashType).map((x) => x.toLowerCase()))
          .optional()
          .default('sha3'),
        digest: Joi.string().allow('').default(''),
        origin: Joi.string().allow('').default(''),
      },
      response: {
        sig: Joi.string().required(),
      },
    },
    prepareTx: {
      request: {
        display: Joi.string().allow('').default(''),
        partialTx: Joi.string().required(),
        requirement: Joi.object({
          tokens: Joi.array()
            .items(
              Joi.object({
                address: Joi.DID().required(),
                value: Joi.BN().positive().required(),
              })
            )
            .required(),
          assets: Joi.object({
            address: Joi.array().items(Joi.DID()).optional(),
            parent: Joi.array().items(Joi.DID()).optional(),
            issuer: Joi.array().items(Joi.DID()).optional(),
          }).optional(),
        }).required(),
      },
      response: {
        finalTx: Joi.string().required(),
      },
    },
    agreement: {
      request: {
        uri: Joi.string()
          .uri({ scheme: ['http', 'https'] })
          .required()
          .allow(''),
        method: Joi.string()
          .allow(...Object.keys(types.HashType).map((x) => x.toLowerCase()))
          .optional()
          .default('sha2'),
        digest: Joi.string().required(),
      },
      response: {
        agreed: Joi.boolean().required(),
        sig: Joi.string().optional(),
      },
    },
    verifiableCredential: {
      request: {
        optional: Joi.boolean().default(false),

        // v1
        item: Joi.array().items(Joi.string().min(1).required()).min(1).optional(), // alias to type
        target: Joi.DID().optional(),
        trustedIssuers: Joi.array().items(TrustedIssuer).min(1).optional(),
        tag: Joi.string().min(1).allow('').default(''),

        // v2
        // - multiple filter should be interpreted as OR
        // - fields inside a filter should be interpreted as AND
        // - values inside a filter field should be interpreted as OR
        filters: Joi.array()
          .items(
            Joi.object({
              type: Joi.array().items(Joi.string().min(1).required()).min(1).optional(),
              target: Joi.DID().optional(),
              trustedIssuers: Joi.array().items(TrustedIssuer).min(1).optional(),
              tag: Joi.string().min(1).allow('').default(''),
            })
          )
          .optional(),
      },
      response: {
        optional: Joi.boolean().default(false),
        assetDid: Joi.DID().optional(),
        presentation: Joi.string().optional(),
      },
    },
    asset: {
      request: {
        optional: Joi.boolean().default(false),

        // v1
        address: Joi.DID().optional(),
        trustedIssuers: Joi.array().items(TrustedIssuer).min(1).optional(),
        trustedParents: Joi.array().items(Joi.DID().required()).min(1).optional(),
        tag: Joi.string().min(1).allow('').default(''),

        // v2
        // - multiple filter should be interpreted as OR
        // - fields inside a filter should be interpreted as AND
        // - values inside a filter field should be interpreted as OR
        filters: Joi.array()
          .items(
            Joi.object({
              address: Joi.DID().optional(),
              trustedIssuers: Joi.array().items(TrustedIssuer).min(1).optional(),
              trustedParents: Joi.array().items(Joi.DID().required()).min(1).optional(),
              tag: Joi.string().min(1).allow('').default(''),
            })
          )
          .optional(),
      },
      response: {
        asset: Joi.DID().required(),
        ownerDid: Joi.DID().required(),
        ownerPk: Joi.string().required(),
        ownerProof: Joi.string().required(),
      },
    },
  };

  const request: ObjectSchema = Joi.object({
    ...createStandardFields(type, description, true),
    ...claims[type].request,
  })
    .options(options)
    .meta({ unknownType: 'string', className: `T${capitalize(type)}Request` });

  const response: ObjectSchema = Joi.object({
    ...createStandardFields(type, description, false),
    ...claims[type].response,
  })
    .options(options)
    .meta({ unknownType: 'string', className: `T${capitalize(type)}Response` });

  return [request, response];
};

const [AuthPrincipalRequest, AuthPrincipalResponse] = createClaimTypes(
  'authPrincipal',
  'Please select account to continue.'
);
const [ProfileRequest, ProfileResponse] = createClaimTypes('profile', 'Please provide your profile to continue.');
const [SignatureRequest, SignatureResponse] = createClaimTypes(
  'signature',
  'Please provide required signature to continue.'
);
const [PrepareTxRequest, PrepareTxResponse] = createClaimTypes(
  'prepareTx',
  'Please provide the transaction to continue.'
);
const [AgreementRequest, AgreementResponse] = createClaimTypes('agreement', 'Confirm your agreement to continue.');
const [VerifiableCredentialRequest, VerifiableCredentialResponse] = createClaimTypes(
  'verifiableCredential',
  'Please provide your verifiable credential to continue.'
);
const [AssetRequest, AssetResponse] = createClaimTypes('asset', 'Please provide your asset to continue.');

// Any claim request
const AnyRequest = Joi.alternatives()
  .try(
    AgreementRequest,
    AssetRequest,
    AuthPrincipalRequest,
    PrepareTxRequest,
    ProfileRequest,
    SignatureRequest,
    VerifiableCredentialRequest
  )
  .meta({ unknownType: 'string', className: 'TAnyRequest' });

// Any claim request
const AnyResponse = Joi.alternatives()
  .try(
    AgreementResponse,
    AssetResponse,
    AuthPrincipalResponse,
    PrepareTxResponse,
    ProfileResponse,
    SignatureResponse,
    VerifiableCredentialResponse
  )
  .meta({ unknownType: 'string', className: 'TAnyResponse' });

const PreviousConnected = Joi.object({
  userDid: Joi.DID().required(),
  userPk: Joi.string().required(),
  didwallet: Joi.string().valid('ios', 'android', 'web').allow('').required(),
})
  .optional()
  .allow(null);

// DID Connect session storage
const Session: ObjectSchema = Joi.object({
  sessionId: Joi.string().required(),
  status: Joi.string()
    .valid(
      'created',
      'walletScanned',
      'walletConnected',
      'appConnected',
      'walletApproved',
      'appApproved',
      'error',
      'timeout',
      'rejected',
      'canceled',
      'completed'
    )
    .required(),
  updaterPk: Joi.string().required(),
  strategy: Joi.alternatives().try(Joi.DID(), Joi.string().valid('default', 'smart')).required(),
  authUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  challenge: Joi.string().required(),
  appInfo: AppInfo.required(),
  onlyConnect: Joi.boolean().default(false).required(),
  autoConnect: Joi.boolean().default(true).required(),
  previousConnected: PreviousConnected,
  currentConnected: Joi.object({
    userDid: Joi.DID().required(),
    userPk: Joi.string().required(),
    didwallet: DIDWalletInfo.required(),
  })
    .optional()
    .allow(null),
  currentStep: Joi.number().integer().min(0).default(0).required(),
  // User can set claims in following format
  // requestedClaims: [[claim1], [claim2, claim3], [claim4]]
  requestedClaims: Joi.array().items(Joi.array().items(AnyRequest).min(1)).default([]).required(),
  // Always a 2 dimension array
  responseClaims: Joi.array().items(Joi.array().items(AnyResponse).min(1)).default([]).required(),
  // Always a flat array
  approveResults: Joi.array().items(Joi.any()).default([]).required(),
  error: Joi.string().optional().allow(''),
  timeout: Joi.object({
    app: Joi.number().positive().required(),
    relay: Joi.number().positive().required(),
    wallet: Joi.number().positive().required(),
  })
    .default({
      app: 10000,
      relay: 10000,
      wallet: 60000,
    })
    .required(),
  // When we need to fetch requestedClaims from another source
  connectUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow(''),
  // When we need to fetch approve results from another source
  approveUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional()
    .allow(''),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'TSession' });

// DID Connect handler context
const Context: ObjectSchema = Joi.object({
  didwallet: DIDWalletInfo.required(),
  body: Joi.object().required(),
  headers: Joi.object().required(),
  sessionId: Joi.string().max(21).min(21).required().allow(''),
  session: Session.required().allow(null),
  locale: Joi.string().required().default('en'),
  signerPk: Joi.string().required().allow(''),
  signerToken: Joi.string().required().allow(''),
  previousConnected: PreviousConnected,
})
  .options(options)
  .meta({ unknownType: 'string', className: 'TContext' });

export {
  AppInfo,
  ChainInfo,
  DIDWalletInfo,
  Context,
  Session,
  AgreementRequest,
  AgreementResponse,
  AssetRequest,
  AssetResponse,
  AuthPrincipalRequest,
  AuthPrincipalResponse,
  PrepareTxRequest,
  PrepareTxResponse,
  ProfileRequest,
  ProfileResponse,
  SignatureRequest,
  SignatureResponse,
  VerifiableCredentialRequest,
  VerifiableCredentialResponse,
  AnyRequest,
  AnyResponse,
  TLocaleCode,
  TSessionStatus,
  TRequest,
  TSignature,
};
