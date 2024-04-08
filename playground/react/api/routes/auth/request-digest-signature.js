/* eslint-disable no-console */
const { toTypeInfo } = require('@arcblock/did');
const { fromPublicKey } = require('@ocap/wallet');
const { types, getHasher } = require('@ocap/mcrypto');
const { toBase58 } = require('@ocap/util');

const logger = require('../../libs/logger');

const hasher = getHasher(types.HashType.SHA3);
const data = 'abcdefghijklmnopqrstuvwxyz'.repeat(32);

const action = 'request-digest-signature';
module.exports = {
  action,
  claims: {
    signature: () => {
      return {
        description: 'Please sign the digest',
        digest: toBase58(hasher(data, 1)),
      };
    },
  },

  // eslint-disable-next-line consistent-return
  onAuth: ({ userDid, userPk, claims, updateSession }) => {
    const type = toTypeInfo(userDid);
    const user = fromPublicKey(userPk, type);
    const claim = claims.find((x) => x.type === 'signature');

    logger.info(`${action}.onAuth`, { userPk, userDid, claim });

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
    updateSession({
      result: {
        origin: data,
        digest: claim.digest,
        sig: claim.sig,
      },
    });
  },
};
