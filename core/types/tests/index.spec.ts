const { ChainInfo, VerifiableCredentialRequest } = require('../src');

describe('Validator', () => {
  test('should chainInfo work', () => {
    expect(ChainInfo.validate({ host: 'none' }).error).toBeFalsy();
    expect(ChainInfo.validate({ host: 'none', id: 'none' }).error).toBeFalsy();
    expect(ChainInfo.validate({ host: 'https://beta.abtnetwork.io' }).error).toBeFalsy();
    expect(ChainInfo.validate({ host: 'https://beta.abtnetwork.io', id: 'beta' }).error).toBeFalsy();
  });

  test('should trusted issuers work', () => {
    const { error } = VerifiableCredentialRequest.validate({
      type: 'verifiableCredential',
      description: 'xxx',
      filters: [
        { trustedIssuers: ['z1Tp3bGid5Kwc1NygaBPdVVg6BuhJagF2G4'] },
        { trustedIssuers: [{ did: 'z1nUziGm98Rigq2ZoRQNyHd4Xw1KkVKCWE6', endpoint: 'https://arcblock.io' }] },
      ],
    });
    expect(error).toBeFalsy();
  });
});
