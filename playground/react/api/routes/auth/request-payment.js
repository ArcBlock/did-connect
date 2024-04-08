/* eslint-disable no-console */
const { fromTokenToUnit } = require('@ocap/util');
const { fromAddress } = require('@ocap/wallet');

const { wallet, client } = require('../../libs/auth');
const { getTokenInfo, pickGasPayerHeaders } = require('../../libs/utils');
const env = require('../../libs/env');
const logger = require('../../libs/logger');

const action = 'request-payment';
module.exports = {
  action,
  claims: {
    signature: async ({ userDid, userPk, extraParams: { locale } }) => {
      const amount = 1;
      const token = await getTokenInfo();

      const description = {
        en: `Please pay ${amount} ${token.symbol} to application`,
        zh: `请支付 ${amount} ${token.symbol}`,
      };

      return {
        type: 'TransferV2Tx',
        data: {
          from: userDid,
          pk: userPk,
          itx: {
            to: wallet.address,
            tokens: [
              {
                address: env.localTokenId,
                value: fromTokenToUnit(amount, token.decimal).toString(),
              },
            ],
          },
        },
        description: description[locale] || description.en,
      };
    },
  },
  onAuth: async ({ req, claims, userDid, extraParams: { locale }, updateSession }) => {
    try {
      const claim = claims.find((x) => x.type === 'signature');
      const tx = client.decodeTx(claim.origin);
      const user = fromAddress(userDid);
      if (claim.from) {
        tx.from = claim.from;
      }
      if (claim.delegator) {
        tx.delegator = claim.delegator;
      }
      const hash = await client.sendTransferV2Tx(
        {
          tx,
          wallet: user,
          signature: claim.sig,
        },
        pickGasPayerHeaders(req)
      );

      logger.info(`${action}.onAuth`, { claims, userDid, hash });
      updateSession({
        result: {
          hash,
          tx,
          origin: claim.origin,
          sig: claim.sig,
        },
      });
      return { hash, tx: claim.origin };
    } catch (err) {
      logger.info(`${action}.onAuth.error`, err);
      const errors = {
        en: 'Send token failed!',
        zh: '支付失败',
      };
      throw new Error(errors[locale] || errors.en);
    }
  },
};
