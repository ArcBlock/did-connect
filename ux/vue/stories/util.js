const sleep = (timeout = 1000) => new Promise((resolve) => setTimeout(resolve, timeout));

const token = 'c6ba08ce34f30e11f10742c3c7edceff314a5e825bee62e9fad8506a1c20b2d4';
const appInfo = {
  icon: 'https://node-dev-1.arcblock.io/admin/blocklet/logo/z8iZjySpAu4jzbMochL9k1okuji1GcS7RRRDM',
  name: 'my-app-name',
  publisher: 'did:abt:z1cmChc9pB1upTBYTQZRFpdTgFesEz4xtY8',
};

export const createFakeCheckFn = (title, timeout, maxCheckCount) => {
  let checkCount = -1;
  return async (url) => {
    // eslint-disable-next-line no-console
    console.log(`checkStatus.${title}`, url);
    await sleep(timeout);

    if (url.startsWith('/error/')) {
      throw new Error('User can see this error');
    }

    if (url.startsWith('/login/token')) {
      return {
        data: {
          token,
          url: 'https://abtwallet.io/i/?appPk=z8dPrakua7KiXDsiRfk14juBfiw54uxHeVYehESHrpTLY&appDid=did%3Aabt%3AzNKtrS7etp2WQYnbVtknbDrVa23Q3eycdcDw&action=requestAuth&url=https%3A%2F%2Fforge-react-starter.netlify.com%2F.netlify%2Ffunctions%2Fapp%2Fapi%2Fdid%2Flogin%2Fauth%3Ftoken%3Dc6ba08ce34f30e11f10742c3c7edceff314a5e825bee62e9fad8506a1c20b2d4',
          appInfo,
        },
      };
    }

    if (url.startsWith('/login/status')) {
      checkCount += 1;
      const status = ['scanned', 'succeed'];
      const index = maxCheckCount < checkCount ? maxCheckCount : checkCount;
      return {
        data: {
          _id: '5cda58a73d6adc4baed678f0',
          token,
          status: status[index > status.length - 1 ? status.length - 1 : index],
          appInfo,
        },
      };
    }

    return {
      data: {},
    };
  };
};

export const messages = {
  title: 'login',
  scan: 'Scan QR code with DID Wallet',
  confirm: 'Confirm login on your DID Wallet',
  success: 'You have successfully signed in!',
};

export const messagesZh = {
  title: '需要登录',
  scan: '用 ABT 钱包扫码登录',
  confirm: '在 ABT 钱包里面确认登录',
  success: '登录成功',
};
