const Joi = require('@arcblock/validator');
const { types } = require('@ocap/mcrypto');

const trustedIssuerSchema = Joi.alternatives().try(
  Joi.object({
    did: Joi.DID().required(),
    endpoint: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
  }),
  Joi.DID().required()
);

module.exports = (chainInfo) => {
  const options = { stripUnknown: true, noDefaults: false };
  const createStandardFields = (type, description) => ({
    type: Joi.string().valid(type).required(),
    description: Joi.string().min(1).default(description),
    chainInfo,
    meta: Joi.any().optional().default({}),
  });

  // Ask wallet to select or create a did for later interaction
  const authPrincipal = Joi.object({
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
  }).options(options);

  const profile = Joi.object({
    ...createStandardFields('profile', 'Please provide your profile to continue.'),
    items: Joi.array()
      .items(Joi.string().valid('fullName', 'email', 'phone', 'signature', 'avatar', 'birthday'))
      .min(1)
      .default(['fullName']),
  })
    .rename('fields', 'items', { ignoreUndefined: true, override: true })
    .options(options);

  const signature = Joi.object({
    ...createStandardFields('signature', 'Sign this transaction or message to continue.'),
    typeUrl: Joi.string().valid('fg:t:transaction', 'mime:text/plain', 'mime:text/html', 'eth:transaction').required(),
    display: Joi.string().allow('').default(''),
    method: Joi.string()
      .allow('none', ...Object.keys(types.HashType).map((x) => x.toLowerCase()))
      .optional()
      .default('sha3'),
    digest: Joi.string().allow('').default(''),
    origin: Joi.string().allow('').default(''),
  }).options(options);

  const prepareTx = Joi.object({
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
  }).options(options);

  const agreement = Joi.object({
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
  }).options(options);

  const verifiableCredential = Joi.object({
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
  }).options(options);

  const asset = Joi.object({
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
  }).options(options);

  return {
    authPrincipal,
    profile,
    signature,
    prepareTx,
    agreement,
    verifiableCredential,
    asset,
  };
};
