/* eslint-disable no-unused-vars */
const Mcrypto = require('@ocap/mcrypto');
const Jwt = require('@arcblock/jwt');
const { fromRandom, WalletType } = require('@ocap/wallet');
const { toBase58 } = require('@ocap/util');
const { toDid } = require('@arcblock/did');
const { AgentAuthenticator } = require('../../lib');

const type = WalletType({
  role: Mcrypto.types.RoleType.ROLE_APPLICATION,
  pk: Mcrypto.types.KeyType.ED25519,
  hash: Mcrypto.types.HashType.SHA3,
});

const agent = fromRandom(type).toJSON();
const chainHost = 'https://beta.abtnetwork.io/api';
const chainId = 'beta';

describe('#AgentAuthenticator', () => {
  test('should be a function', () => {
    expect(typeof AgentAuthenticator).toEqual('function');
  });

  const auth = new AgentAuthenticator({
    wallet: agent,
    baseUrl: 'http://beta.abtnetwork.io/webapp',
    appInfo: {
      name: 'Connect Service',
      description: 'Demo Service that uses Authorized DID Auth',
      icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
      link: 'http://beta.abtnetwork.io/webapp',
    },
    chainInfo: {
      host: chainHost,
      id: chainId,
    },
  });

  test('should sign correct claims and verify those claims', async () => {
    const user = fromRandom();
    const userPk = toBase58(user.publicKey);
    const userDid = user.address;

    const authorizer = fromRandom(type);

    const claims = {
      profile: () => ({
        fields: ['fullName', 'email'],
        description: 'Please provide these info to continue',
      }),
    };

    const token = Jwt.sign(authorizer.address, authorizer.secretKey, {
      sub: agent.address,
      ops: {
        profile: ['fullName', 'email', 'phone'],
      },
    });

    const signed = await auth.sign({
      context: {
        token: '123',
        userPk,
        userDid,
      },
      claims,
      appInfo: {
        name: 'DID Wallet Demo',
        description: 'Demo application to show the potential of DID Wallet',
        icon: 'https://arcblock.oss-cn-beijing.aliyuncs.com/images/wallet-round.png',
        link: 'http://beta.abtnetwork.io/webapp',
      },
      authorizer: { pk: authorizer.publicKey, did: authorizer.address },
      verifiableClaims: [{ type: 'certificate', content: token }],
    });
    expect(signed.appPk).toEqual(toBase58(authorizer.publicKey));
    expect(signed.agentPk).toEqual(toBase58(agent.pk));
    const decoded = Jwt.decode(signed.authInfo);
    expect(decoded.agentDid).toEqual(toDid(agent.address));
    expect(decoded.iss).toEqual(toDid(authorizer.address));
    expect(decoded.appInfo.publisher).toEqual(toDid(authorizer.address));
    expect(decoded.appInfo.name).toEqual('DID Wallet Demo');
    expect(Array.isArray(decoded.requestedClaims)).toBeTruthy();
    expect(Array.isArray(decoded.verifiableClaims)).toBeTruthy();

    expect(Jwt.verify(signed.authInfo, agent.pk, { signerKey: 'agentDid' })).toBeTruthy();
  });
});
