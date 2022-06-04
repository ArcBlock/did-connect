const joinUrl = require('url-join');

const createAuthUrl = (baseUrl, sessionId) => {
  if (!baseUrl) {
    throw new Error('baseUrl is required when createAuthUrl');
  }
  if (!sessionId) {
    throw new Error('sessionId is required when createAuthUrl');
  }
  if (baseUrl.startsWith('/')) {
    // we are in browser
    if (typeof window === 'undefined') {
      throw new Error('Can not create authUrl with pathname in none-browser env');
    }

    // eslint-disable-next-line no-undef
    const tmp = new URL(window.location.origin);
    tmp.pathname = joinUrl(baseUrl, '/auth');
    tmp.searchParams.set('sid', sessionId);
    return tmp.href;
  }

  // We are in node or browser
  const tmp = new URL(baseUrl);
  tmp.pathname = joinUrl(tmp.pathname, '/auth');
  tmp.searchParams.set('sid', sessionId);
  return tmp.href;
};

const createDeepLink = (baseUrl, sessionId) => {
  const tmp = new URL('https://abtwallet.io/i/');
  tmp.searchParams.set('action', 'requestAuth');
  tmp.searchParams.set('url', encodeURIComponent(createAuthUrl(baseUrl, sessionId)));
  return tmp.href;
};

module.exports = {
  createAuthUrl,
  createDeepLink,
};
