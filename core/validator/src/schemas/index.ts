import { ObjectSchema } from 'joi';
import { Joi } from '@arcblock/validator';
import { types } from '@ocap/mcrypto';

// shared schema options
const options = { stripUnknown: true, noDefaults: false };

// Basic Types
export const ChainInfoSchema: ObjectSchema = Joi.object({
  id: Joi.string().optional(),
  host: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .allow('none'),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'ChainInfoType' });

export const AppInfoSchema: ObjectSchema = Joi.object({
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

// Requested Claims
export type ClaimType =
  | 'authPrincipal'
  | 'profile'
  | 'signature'
  | 'prepareTx'
  | 'agreement'
  | 'verifiableCredential'
  | 'asset';
export type SignatureType = 'fg:g:transaction' | 'eth:transaction' | 'mime:text/html' | 'mime:text/plain';
const createStandardFields = (type: ClaimType, description: string) => ({
  type: Joi.string().valid(type).required(),
  description: Joi.string().min(1).required().default(description),
  chainInfo: ChainInfoSchema,
  meta: Joi.any().optional().default({}),
});
const trustedIssuerSchema = Joi.alternatives().try(
  Joi.object({
    did: Joi.DID().required(),
    endpoint: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
  }),
  Joi.DID().required()
);

// Ask wallet to select or create a did for later interaction
export const AuthPrincipalClaim: ObjectSchema = Joi.object({
  ...createStandardFields('authPrincipal', 'Please select account to continue.'),

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
})
  .options(options)
  .meta({ unknownType: 'string', className: 'AuthPrincipalClaimType' });

// Ask wallet to provide profile
export const ProfileClaim: ObjectSchema = Joi.object({
  ...createStandardFields('profile', 'Please provide your profile to continue.'),
  items: Joi.array()
    .items(Joi.string().valid('fullName', 'email', 'phone', 'signature', 'avatar', 'birthday'))
    .min(1)
    .default(['fullName']),
})
  .rename('fields', 'items', { ignoreUndefined: true, override: true })
  .options(options)
  .meta({ unknownType: 'string', className: 'ProfileClaimType' });

// Ask wallet to sign something
export const SignatureClaim: ObjectSchema = Joi.object({
  ...createStandardFields('signature', 'Sign this transaction or message to continue.'),
  typeUrl: Joi.string().valid('fg:t:transaction', 'mime:text/plain', 'mime:text/html', 'eth:transaction').required(),
  display: Joi.string().allow('').default(''),
  method: Joi.string()
    .allow('none', ...Object.keys(types.HashType).map((x) => x.toLowerCase()))
    .optional()
    .default('sha3'),
  digest: Joi.string().allow('').default(''),
  origin: Joi.string().allow('').default(''),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'SignatureClaimType' });

// Ask wallet to pay something
export const PrepareTxClaim: ObjectSchema = Joi.object({
  ...createStandardFields('prepareTx', 'Prepare and sign this transaction to continue.'),
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
})
  .options(options)
  .meta({ unknownType: 'string', className: 'PrepareTxClaimType' });

// Ask wallet to agree something
export const AgreementClaim: ObjectSchema = Joi.object({
  ...createStandardFields('agreement', 'Confirm your agreement to continue.'),
  uri: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .allow(''),
  method: Joi.string()
    .allow(...Object.keys(types.HashType).map((x) => x.toLowerCase()))
    .optional()
    .default('sha2'),
  digest: Joi.string().required(),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'AgreementClaimType' });

// Ask wallet to present verifiable credential
export const VerifiableCredentialClaim: ObjectSchema = Joi.object({
  ...createStandardFields('verifiableCredential', 'Please present a verifiable credential to continue.'),

  optional: Joi.boolean().default(false),

  // v1
  item: Joi.array().items(Joi.string().min(1).required()).min(1).optional(), // alias to type
  target: Joi.DID().optional(),
  trustedIssuers: Joi.array().items(trustedIssuerSchema).min(1).optional(),
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
        trustedIssuers: Joi.array().items(trustedIssuerSchema).min(1).optional(),
        tag: Joi.string().min(1).allow('').default(''),
      })
    )
    .optional(),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'VerifiableCredentialClaimType' });

// ask wallet to present on-chain asset
export const AssetClaim: ObjectSchema = Joi.object({
  ...createStandardFields('asset', 'Please present an on chain asset to continue.'),

  optional: Joi.boolean().default(false),

  // v1
  address: Joi.DID().optional(),
  trustedIssuers: Joi.array().items(trustedIssuerSchema).min(1).optional(),
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
        trustedIssuers: Joi.array().items(trustedIssuerSchema).min(1).optional(),
        trustedParents: Joi.array().items(Joi.DID().required()).min(1).optional(),
        tag: Joi.string().min(1).allow('').default(''),
      })
    )
    .optional(),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'AssetClaimType' });

// Any claim
export const AnyClaimSchema = Joi.alternatives()
  .try(
    AuthPrincipalClaim,
    ProfileClaim,
    SignatureClaim,
    PrepareTxClaim,
    AgreementClaim,
    VerifiableCredentialClaim,
    AssetClaim
  )
  .meta({ unknownType: 'string', className: 'AnyClaimType' });

// DID Connect session storage
export const SessionSchema: ObjectSchema = Joi.object({
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
  appInfo: AppInfoSchema,
  onlyConnect: Joi.boolean().default(false),
  autoConnect: Joi.boolean().default(true),
  previousConnected: Joi.object({
    userDid: Joi.DID().required(),
    userPk: Joi.string().required(),
    didwallet: Joi.string().required(),
  })
    .optional()
    .allow(null),
  currentConnected: Joi.object({
    userDid: Joi.DID().required(),
    userPk: Joi.string().required(),
    didwallet: Joi.object({
      os: Joi.string().required(),
      version: Joi.string().required(),
      jwt: Joi.string().required(),
    }).required(),
  })
    .optional()
    .allow(null),
  currentStep: Joi.number().integer().min(0),
  requestedClaims: Joi.array()
    .items(Joi.alternatives().try(Joi.array().items(AnyClaimSchema).min(1), AnyClaimSchema))
    .default([]),
  responseClaims: Joi.array().items(Joi.array().items(Joi.any()).min(0)).default([]),
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
export const ContextSchema: ObjectSchema = Joi.object({
  didwallet: Joi.object().optional(),
  body: Joi.object().optional().default({}),
  headers: Joi.object().required(),
  sessionId: Joi.string().max(21).min(21).allow(''),
  session: SessionSchema.allow(null),
  locale: Joi.string().required(),
  signerPk: Joi.string().optional().allow(''),
  signerToken: Joi.string().optional().allow(''),
  previousConnected: Joi.object().optional().allow(null),
})
  .options(options)
  .meta({ unknownType: 'string', className: 'ContextType' });
