const { fromBase58, toBase58 } = require('@ocap/util');
const { getHasher, types } = require('@ocap/mcrypto');

const { getRandomMessage } = require('../../libs/utils');
const logger = require('../../libs/logger');
// const env = require('../../libs/env');
// const { wallet } = require('../../libs/auth');

const hasher = getHasher(types.HashType.SHA3);
const data = 'abcdefghijklmnopqrstuvwxyz'.repeat(32);

const action = 'multiple-steps';
module.exports = {
  action,
  claims: [
    // {
    //   signature: () => {
    //     return {
    //       type: 'TransferV2Tx',
    //       data: {
    //         itx: {
    //           to: wallet.address,
    //           tokens: [
    //             {
    //               address: env.localTokenId,
    //               value: fromTokenToUnit(1, 18).toString(),
    //             },
    //           ],
    //         },
    //       },
    //       description: 'Please sign the transaction, you will send 1 token',
    //     };
    //   },
    // },
    {
      signature: () => {
        return {
          type: 'mime:text/plain',
          data: getRandomMessage(),
          description: 'Please sign the text',
        };
      },
    },
    {
      signature: () => {
        return {
          description: 'Please sign the digest',
          digest: toBase58(hasher(data, 1)),
        };
      },
    },
  ],

  onAuth: ({ userDid, userPk, claims, step, req, updateSession }) => {
    logger.info(`${action}.onAuth`, { step, userPk, userDid, claims });
    const result = req?.context?.store?.result || [];
    const claim = claims.find((x) => x.type === 'signature');
    if (step === 1) {
      result.push({
        step,
        origin: fromBase58(claim.origin).toString(),
        sig: claim.sig,
      });
    } else if (step === 2) {
      result.push({
        step,
        origin: data,
        digest: claim.digest,
        sig: claim.sig,
      });
    }

    updateSession({
      result,
    });
  },
};
