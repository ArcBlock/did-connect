const { claims } = require('../lib');

describe('Validator', () => {
  test('should trusted issuers work', () => {
    const { error } = claims.verifiableCredential.validate({
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
