require('node-localstorage/register'); // polyfill ls

const axios = require('axios');
const joinUrl = require('url-join');
const objectHash = require('object-hash');
const Jwt = require('@arcblock/jwt');
const { fromRandom, fromSecretKey } = require('@ocap/wallet');

const createSocketEndpoint = (baseUrl) => {
  if (!baseUrl) {
    throw new Error('baseUrl is required when createSocketEndpoint');
  }

  let endpoint = baseUrl;

  // we are in browser
  if (baseUrl.startsWith('/')) {
    if (typeof window === 'undefined') {
      throw new Error('Can not create authUrl with pathname in none-browser env');
    }

    // eslint-disable-next-line no-undef
    const tmp = new URL(window.location.origin);
    tmp.pathname = joinUrl(baseUrl);
    endpoint = tmp.href;
  }

  return endpoint.replace('https:', 'wss:').replace('http:', 'ws:');
};

const createApiUrl = (baseUrl, sessionId, suffix = '/auth') => {
  if (!baseUrl) {
    throw new Error('baseUrl is required when createApiUrl');
  }
  if (!sessionId) {
    throw new Error('sessionId is required when createApiUrl');
  }
  if (baseUrl.startsWith('/')) {
    // we are in browser
    if (typeof window === 'undefined') {
      throw new Error('Can not create authUrl with pathname in none-browser env');
    }

    // eslint-disable-next-line no-undef
    const tmp = new URL(window.location.origin);
    tmp.pathname = joinUrl(baseUrl, suffix);
    tmp.searchParams.set('sid', sessionId);
    return tmp.href;
  }

  // We are in node or browser
  const tmp = new URL(baseUrl);
  tmp.pathname = joinUrl(tmp.pathname, suffix);
  tmp.searchParams.set('sid', sessionId);
  return tmp.href;
};

const createDeepLink = (baseUrl, sessionId) => {
  const tmp = new URL('https://abtwallet.io/i/');
  tmp.searchParams.set('action', 'requestAuth');
  tmp.searchParams.set('url', encodeURIComponent(createApiUrl(baseUrl, sessionId)));
  return tmp.href;
};

const doSignedRequest = async ({ data, wallet, url, method = 'POST' }) => {
  const headers = {};
  headers['x-updater-pk'] = wallet.publicKey;
  headers['x-updater-token'] = Jwt.sign(wallet.address, wallet.secretKey, { hash: objectHash(data) });
  const res = await axios({ method, url, data, headers, timeout: 8000 });
  return res.data;
};

const getUpdater = () => {
  // eslint-disable-next-line no-undef
  const sk = localStorage.getItem('updater-sk');
  if (sk) {
    return fromSecretKey(sk);
  }

  const updater = fromRandom();
  // eslint-disable-next-line no-undef
  localStorage.setItem('updater-sk', updater.secretKey);
  return updater;
};

const isAsyncFunction = (fn) => {
  if (fn.constructor.name === 'AsyncFunction') {
    return true;
  }

  return false;
};

module.exports = {
  createSocketEndpoint,
  createApiUrl,
  createDeepLink,
  doSignedRequest,
  getUpdater,
  isAsyncFunction,
};
