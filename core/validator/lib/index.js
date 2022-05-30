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

module.exports = Object.freeze({
  chainInfo,
  appInfo,
  claims: createClaimsSchema(chainInfo),
});
