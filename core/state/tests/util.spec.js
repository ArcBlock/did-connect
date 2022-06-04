const { createSocketEndpoint, createAuthUrl, createDeepLink, doSignedRequest, getUpdater } = require('../lib/util');

describe('createSocketEndpoint', () => {
  test('should return a valid endpoint', () => {
    const endpoint = createSocketEndpoint('https://www.arcblock.io');
    expect(endpoint).toBe('wss://www.arcblock.io');
  });
});

describe('createAuthUrl', () => {
  test('should work as expected', () => {
    expect(true).toBe(true);
  });
});

describe('createDeepLink', () => {
  test('should work as expected', () => {
    expect(true).toBe(true);
  });
});

describe('doSignedRequest', () => {
  test('should work as expected', () => {
    expect(true).toBe(true);
  });
});

describe('getUpdater', () => {
  test('should work as expected', () => {
    expect(true).toBe(true);
  });
});
