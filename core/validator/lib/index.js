const Joi = require('@arcblock/validator');

const createClaimsSchema = require('./claims');

const chainInfo = Joi.object({
  id: Joi.string().optional(),
  host: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .allow('none'),
}).options({ stripUnknown: true, noDefaults: false });

const appInfo = Joi.object({
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
}).options({ stripUnknown: false, noDefaults: false });

const claims = createClaimsSchema(chainInfo);

const session = Joi.object({
  status: Joi.string().required(), // TODO: whitelist
  updaterPk: Joi.string().required(),
  strategy: Joi.alternatives().try(Joi.DID(), Joi.string().valid('default')),
  authUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required(),
  challenge: Joi.string().required(),
  appInfo,
  previousConnected: Joi.object({
    userDid: Joi.DID().required(),
    userPk: Joi.string().required(),
    wallet: Joi.any().required(),
  })
    .optional()
    .allow(null),
  currentConnected: Joi.object({
    userDid: Joi.DID().required(),
    userPk: Joi.string().required(),
  })
    .optional()
    .allow(null),
  currentStep: Joi.number().integer().min(0),
  requestedClaims: Joi.array()
    .items(...Object.values(claims))
    .default([]),
  responseClaims: Joi.array().items(Joi.any()).default([]),
  approveResults: Joi.array().items(Joi.any()).default([]),
  error: Joi.string().optional().allow(''),
}).options({ stripUnknown: true, noDefaults: false });

const context = Joi.object({
  didwallet: Joi.object().optional(),
  body: Joi.object().optional().default({}),
  headers: Joi.object().required(),
  sessionId: Joi.string().guid().required(),
  session: session.optional().default(null),
  locale: Joi.string().required(),
  previousConnected: Joi.object().optional().allow(null),
}).options({ stripUnknown: true, noDefaults: false });

module.exports = Object.freeze({
  session,
  context,
  claims,
  chainInfo,
  appInfo,
  Joi,
});
