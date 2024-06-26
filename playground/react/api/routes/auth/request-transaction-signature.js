/* eslint-disable no-console */
const { toTypeInfo } = require('@arcblock/did');
const { fromPublicKey } = require('@ocap/wallet');
const { toTxHash } = require('@ocap/mcrypto');
const { toBase58 } = require('@ocap/util');

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
    const tx = client.decodeTx(claim.origin);

    logger.info(`${action}.onAuth`, { userPk, userDid, claim });
    const buffer = Buffer.from(claim.origin);
    const hash = toTxHash(buffer);

    updateSession({
      result: {
        hash,
        tx,
        origin: claim.origin,
        sig: claim.sig,
      },
    });
  },
};
