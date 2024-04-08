/* eslint-disable no-console */
const { toTypeInfo } = require('@arcblock/did');
const { fromPublicKey } = require('@ocap/wallet');
const { fromBase58, toBase58 } = require('@ocap/util');

const logger = require('../../libs/logger');
const env = require('../../libs/env');
const { wallet, client } = require('../../libs/auth');

const action = 'request-transaction-signature';

module.exports = {
  action,
  claims: {
    signature: async ({ userPk, userDid }) => {
      const value = await client.fromTokenToUnit(1);
      const type = toTypeInfo(userDid);
      const encoded = await client.encodeTransferV2Tx({
        tx: {
          itx: {
            to: wallet.address,
            tokens: [
              {
                address: env.localTokenId,
                value: value.toString(),
              },
            ],
          },
        },
        wallet: fromPublicKey(userPk, type),
      });
      const origin = toBase58(encoded.buffer);

      return {
        description: 'Please sign the transaction',
        type: 'fg:t:transaction',
        data: origin,
      };
    },
  },

  // eslint-disable-next-line consistent-return
  onAuth: ({ userDid, userPk, claims, updateSession }) => {
    const claim = claims.find((x) => x.type === 'signature');

    logger.info(`${action}.onAuth`, { userPk, userDid, claim });

    // if (claim.origin) {
    //   const type = toTypeInfo(userDid);
    //   const user = fromPublicKey(userPk, type);
    //   if (user.verify(claim.origin, claim.sig, claim.method !== 'none') === false) {
    //     throw new Error('Origin 签名错误');
    //   }
    // }

    updateSession({
      result: {
        transaction: fromBase58(claim.origin).toString(),
        sig: claim.sig,
      },
    });
  },
};
