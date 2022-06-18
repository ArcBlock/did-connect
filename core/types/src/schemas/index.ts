import { ObjectSchema } from 'joi';
import { Joi } from '@arcblock/validator';
import { types } from '@ocap/mcrypto';

// shared schema options
const options = { stripUnknown: true, noDefaults: false };
const capitalize = (input: string): string => input.charAt(0).toUpperCase() + input.slice(1);

type LocaleType = 'en' | 'zh';

// Basic Types
const ChainInfo: ObjectSchema = Joi.object({
  id: Joi.string().optional(),
  host: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .allow('none'),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'ChainInfoType' });

const AppInfo: ObjectSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  icon: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  link: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .optional(),
  path: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .default('https://abtwallet.io/i/'),
  publisher: Joi.string().optional(),
  updateSubEndpoint: Joi.boolean().optional(),
  subscriptionEndpoint: Joi.string().optional(),
  nodeDid: Joi.DID().optional(),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'AppInfoType' });

const DIDWalletInfo = Joi.object({
  os: Joi.string().valid('ios', 'android', 'web').required(),
  version: Joi.string().required(),
  jwt: Joi.string().required(),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'DIDWalletInfoType' });

// did-connect claim type utils
type RequestType =
  | 'authPrincipal'
  | 'profile'
  | 'signature'
  | 'prepareTx'
  | 'agreement'
  | 'verifiableCredential'
  | 'asset';
type SignatureType = 'fg:g:transaction' | 'eth:transaction' | 'mime:text/html' | 'mime:text/plain';
const createStandardFields = (type: string, description: string) => ({
  type: Joi.string().valid(type).required(),
  description: Joi.string().min(1).required().default(description),
  chainInfo: ChainInfo,
  meta: Joi.any().optional().default({}),
});
const TrustedIssuer = Joi.alternatives().try(
  Joi.object({
    did: Joi.DID().required(),
    endpoint: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
  }),
  Joi.DID().required()
);
const createClaimTypes = (type: RequestType, description: string): ObjectSchema[] => {
  const claims = {
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
      response: {},
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
        presentation: Joi.string().required(),
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
    ...createStandardFields(type, description),
    ...claims[type].request,
  })
    .options(options)
    .meta({ unknownType: 'string', className: `${capitalize(type)}RequestType` });

  const response: ObjectSchema = Joi.object({
    ...createStandardFields(type, description),
    ...claims[type].request,
    ...claims[type].request,
  })
    .options(options)
    .meta({ unknownType: 'string', className: `${capitalize(type)}ResponseType` });

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
    AuthPrincipalRequest,
    ProfileRequest,
    SignatureRequest,
    PrepareTxRequest,
    AgreementRequest,
    VerifiableCredentialRequest,
    AssetRequest
  )
  .meta({ unknownType: 'string', className: 'AnyRequestType' });

const RequestList = Joi.array()
  .items(AnyRequest)
  .default([])
  .meta({ unknownType: 'string', className: 'RequestListType' });

// Any claim request
const AnyResponse = Joi.alternatives()
  .try(
    AuthPrincipalResponse,
    ProfileResponse,
    SignatureResponse,
    PrepareTxResponse,
    AgreementResponse,
    VerifiableCredentialResponse,
    AssetResponse
  )
  .meta({ unknownType: 'string', className: 'AnyResponseType' });

const ResponseList = Joi.array()
  .items(AnyResponse)
  .default([])
  .meta({ unknownType: 'string', className: 'ResponseListType' });

const PreviousConnected = Joi.object({
  userDid: Joi.DID().required(),
  userPk: Joi.string().required(),
  didwallet: Joi.string().valid('ios', 'android', 'web').required(),
})
  .optional()
  .allow(null);

// DID Connect session storage
const Session: ObjectSchema = Joi.object({
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
  strategy: Joi.alternatives().try(Joi.DID(), Joi.string().valid('default')),
  authUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  challenge: Joi.string().required(),
  appInfo: AppInfo,
  onlyConnect: Joi.boolean().default(false),
  autoConnect: Joi.boolean().default(true),
  previousConnected: PreviousConnected,
  currentConnected: Joi.object({
    userDid: Joi.DID().required(),
    userPk: Joi.string().required(),
    didwallet: DIDWalletInfo.required(),
  })
    .optional()
    .allow(null),
  currentStep: Joi.number().integer().min(0),
  // User can set claims in following format
  // requestedClaims: [claim1, [claim2, claim3], claim4]
  requestedClaims: Joi.array()
    .items(Joi.alternatives().try(Joi.array().items(AnyRequest).min(1), AnyRequest))
    .default([]),
  // Always a 2 dimension array
  responseClaims: Joi.array().items(Joi.array().items(AnyResponse).min(1)).default([]),
  // Always a flat array
  approveResults: Joi.array().items(Joi.any()).default([]),
  error: Joi.string().optional().allow(''),
  timeout: Joi.object({
    app: Joi.number().positive(),
    relay: Joi.number().positive(),
    wallet: Joi.number().positive(),
  }).default({
    app: 10000,
    relay: 10000,
    wallet: 60000,
  }),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'SessionType' });

// DID Connect handler context
const Context: ObjectSchema = Joi.object({
  didwallet: DIDWalletInfo.required(),
  body: Joi.object().optional().default({}),
  headers: Joi.object().required(),
  sessionId: Joi.string().max(21).min(21).allow('').required(),
  session: Session.allow(null),
  locale: Joi.string().required().default('en'),
  signerPk: Joi.string().optional().allow(''),
  signerToken: Joi.string().optional().allow(''),
  previousConnected: PreviousConnected,
})
  .options(options)
  .meta({ unknownType: 'string', className: 'ContextType' });

export {
  AppInfo,
  ChainInfo,
  DIDWalletInfo,
  Context,
  Session,
  LocaleType,
  RequestType,
  SignatureType,
  AuthPrincipalRequest,
  ProfileRequest,
  SignatureRequest,
  PrepareTxRequest,
  AgreementRequest,
  VerifiableCredentialRequest,
  AssetRequest,
  AuthPrincipalResponse,
  ProfileResponse,
  SignatureResponse,
  PrepareTxResponse,
  AgreementResponse,
  VerifiableCredentialResponse,
  AssetResponse,
  AnyRequest,
  RequestList,
  AnyResponse,
  ResponseList,
};
