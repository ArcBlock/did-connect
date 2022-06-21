import { parseWalletUA, getStepChallenge, formatDisplay } from '../src/util';

describe('#parseWalletUA', () => {
  describe('#android', () => {
    test('should parse "User-Agent: okhttp/3.12.2 (Linux; U; LGE Build/Nexus5)" correctly', async () => {
      const wallet = parseWalletUA('User-Agent: okhttp/3.12.2 (Linux; U; LGE Build/Nexus5)');
      expect(wallet).toEqual({ os: '', version: '', jwt: '1.0.0' });
    });

    test('should parse "User-Agent: okhttp/3.12.2 ArcWallet/ (Linux; U; Android 25; LGE Build/Nexus5)" correctly', async () => {
      const wallet = parseWalletUA('User-Agent: okhttp/3.12.2 ArcWallet/ (Linux; U; Android 25; LGE Build/Nexus5)');
      expect(wallet).toEqual({ os: 'android', version: '', jwt: '1.0.0' });
    });

    test('should parse "User-Agent: okhttp/3.12.2 ArcWallet/1.3.62 (Linux; U; Android 25; LGE Build/Nexus5)" correctly', async () => {
      const wallet = parseWalletUA(
        'User-Agent: okhttp/3.12.2 ArcWallet/1.3.62 (Linux; U; Android 25; LGE Build/Nexus5)'
      );
      expect(wallet).toEqual({ os: 'android', version: '1.3.62', jwt: '1.0.0' });
    });

    test('should parse "User-Agent: okhttp/3.12.2 ArcWallet/2.7.17 (Linux; U; Android 25; LGE Build/Nexus5)" correctly', async () => {
      const wallet = parseWalletUA(
        'User-Agent: okhttp/3.12.2 ArcWallet/2.7.17 (Linux; U; Android 25; LGE Build/Nexus5)'
      );
      expect(wallet).toEqual({ os: 'android', version: '2.7.17', jwt: '1.1.0' });
    });
  });

  describe('#ios', () => {
    test('should parse "iPhone12,3 iOS/13.0 CFNetwork/1098.7" correctly', async () => {
      const wallet = parseWalletUA('iPhone12,3 iOS/13.0 CFNetwork/1098.7');
      expect(wallet).toEqual({ os: '', version: '', jwt: '1.0.0' });
    });

    test('should parse "ArcWallet/ iPhone12,3 iOS/13.0 CFNetwork/1098.7 Darwin/19.0.0" correctly', async () => {
      const wallet = parseWalletUA('ArcWallet/ iPhone12,3 iOS/13.0 CFNetwork/1098.7 Darwin/19.0.0');
      expect(wallet).toEqual({ os: 'ios', version: '', jwt: '1.0.0' });
    });

    test('should parse "ArcWallet/1.3.29 iPhone12,3 iOS/13.0 CFNetwork/1098.7 Darwin/19.0.0" correctly', async () => {
      const wallet = parseWalletUA('ArcWallet/1.3.29 iPhone12,3 iOS/13.0 CFNetwork/1098.7 Darwin/19.0.0');
      expect(wallet).toEqual({ os: 'ios', version: '1.3.29', jwt: '1.0.0' });
    });

    test('should parse "ArcWallet/2.7.2 iPhone12,3 iOS/13.0 CFNetwork/1098.7 Darwin/19.0.0" correctly', async () => {
      const wallet = parseWalletUA('ArcWallet/2.7.2 iPhone12,3 iOS/13.0 CFNetwork/1098.7 Darwin/19.0.0');
      expect(wallet).toEqual({ os: 'ios', version: '2.7.2', jwt: '1.1.0' });
    });
  });

  describe('#web', () => {
    test('should parse "ArcWallet/0.5.0"', async () => {
      const wallet = parseWalletUA('ArcWallet/0.5.0');
      expect(wallet).toEqual({ os: 'web', version: '0.5.0', jwt: '1.1.0' });
    });
  });
});

describe('getStepChallenge', () => {
  test('should return random bytes', async () => {
    const c1 = getStepChallenge();
    const c2 = getStepChallenge();
    expect(c1).toBeTruthy();
    expect(c2).toBeTruthy();
    expect(c1).not.toEqual(c2);
  });
});

describe('formatDisplay', () => {
  test('should formatDisplay work as expected', () => {
    const fn = formatDisplay;
    expect(fn('')).toEqual('');
    // @ts-ignore
    expect(fn(null)).toEqual('');
    // @ts-ignore
    expect(fn(undefined)).toEqual('');
    // @ts-ignore
    expect(fn(0)).toEqual('');
    expect(fn('abc')).toEqual('');
    expect(fn({ type: 'url', content: 'https://www.arcblock.io' })).toEqual(
      JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' })
    );
    expect(fn(JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' }))).toEqual(
      JSON.stringify({ type: 'url', content: 'https://www.arcblock.io' })
    );
    expect(fn(JSON.stringify({ type: 'url' }))).toEqual('');
    expect(fn('{"value":xxx}')).toEqual('');
  });
});
