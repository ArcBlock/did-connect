const { toTypeInfo } = require('@arcblock/did');
const { fromPublicKey } = require('@ocap/wallet');

const logger = require('../../libs/logger');
const { client } = require('../../libs/auth');

module.exports = {
  action: 'test',
  claims: {
    signature: async ({ userPk }) => {
      const type = 'text';

      const params = {
        text: {
          type: 'mime:text/plain',
          data: 'from api',
        },
      };

      if (!params[type]) {
        throw new Error(`Unsupported signature type ${type}`);
      }

      return Object.assign({ description: `Please sign the ${type}` }, params[type]);
    },
  },

  // eslint-disable-next-line consistent-return
  onAuth: async ({ userDid, userPk, claims }) => {
    const type = toTypeInfo(userDid);
    const user = fromPublicKey(userPk, type);
    const claim = claims.find((x) => x.type === 'signature');

    logger.info('claim.signature.onAuth', { userPk, userDid, claim });

    if (claim.origin) {
      if (user.verify(claim.origin, claim.sig, claim.method !== 'none') === false) {
        throw new Error('Origin 签名错误');
      }
    }

    // We do not need to hash the data when verifying
    if (claim.digest) {
      if (user.verify(claim.digest, claim.sig, false) === false) {
        throw new Error('Digest 签名错误');
      }
    }

    if (claim.meta && claim.meta.origin) {
      const tx = client.decodeTx(claim.meta.origin);
      const hash = await client.sendTransferV2Tx({
        tx,
        wallet: user,
        signature: claim.sig,
      });

      logger.info('signature.evil.onAuth', { claims, userDid, hash });
      return { hash, tx: claim.meta.origin };
    }
  },
};
