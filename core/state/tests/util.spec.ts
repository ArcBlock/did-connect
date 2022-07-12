// @ts-ignore
import { createSocketEndpoint, createApiUrl, createDeepLink, doSignedRequest, getUpdater } from '../src/util';

// @ts-ignore
import('node-localstorage/register');

describe('Util', () => {
  const mockWindow = () => {
    global.window = {
      // @ts-ignore
      location: new URL('https://www.arcblock.io'),
    };
  };

  const resetWindow = () => {
    // @ts-ignore
    global.window = undefined;
  };

  describe('createSocketEndpoint', () => {
    test('should return socket endpoint for absolute', () => {
      // @ts-ignore
      expect(() => createSocketEndpoint()).toThrow();
      expect(() => createSocketEndpoint('/api/connect/relay')).toThrow();
      const endpoint = createSocketEndpoint('https://www.arcblock.io');
      expect(endpoint).toBe('wss://www.arcblock.io');
    });

    test('should return socket endpoint for relative', () => {
      mockWindow();
      const endpoint = createSocketEndpoint('/api/connect/relay');
      expect(endpoint).toBe('wss://www.arcblock.io/api/connect/relay');
      resetWindow();
    });
  });

  describe('createApiUrl', () => {
    test('should throw on invalid param ', () => {
      expect(() => createApiUrl('https://www.arcblock.io', '', '/auth')).toThrow();
      expect(() => createApiUrl('', '/api/connect/relay', '/auth')).toThrow();
    });

    test('should return valid url for absolute', () => {
      expect(createApiUrl('https://www.arcblock.io/api/connect/relay', 'abcd', '/auth')).toEqual(
        'https://www.arcblock.io/api/connect/relay/auth?sid=abcd'
      );
    });

    test('should return valid url for absolute', () => {
      expect(() => createApiUrl('/api/connect/relay', 'abc', '/auth')).toThrow();

      mockWindow();
      expect(createApiUrl('/api/connect/relay', 'abcd', '/auth')).toEqual(
        'https://www.arcblock.io/api/connect/relay/auth?sid=abcd'
      );
      expect(createApiUrl('/api/connect/relay', 'abcd', '/session')).toEqual(
        'https://www.arcblock.io/api/connect/relay/session?sid=abcd'
      );
      resetWindow();
    });
  });

  describe('createDeepLink', () => {
    test('should work as expected', () => {
      expect(createDeepLink('https://www.arcblock.io/api/connect/relay', 'abcd')).toEqual(
        'https://abtwallet.io/i/?action=requestAuth&url=https%253A%252F%252Fwww.arcblock.io%252Fapi%252Fconnect%252Frelay%252Fauth%253Fsid%253Dabcd'
      );
    });
  });

  describe('doSignedRequest', () => {
    test('should work as expected', () => {
      expect(typeof doSignedRequest).toBe('function');
    });
  });

  describe('getUpdater', () => {
    test('should work as expected', () => {
      expect(typeof getUpdater).toBe('function');

      const updater = getUpdater();
      expect(updater.publicKey).toBeTruthy();
      expect(updater.secretKey).toBeTruthy();
      expect(typeof updater.sign).toBe('function');
      expect(typeof updater.verify).toBe('function');
    });
  });
});
