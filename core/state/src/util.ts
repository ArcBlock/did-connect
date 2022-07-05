import axios from 'axios';
import isEmpty from 'lodash/isEmpty';
// @ts-ignore
import joinUrl from 'url-join';
// @ts-ignore
import objectHash from 'object-hash';
import { sign } from '@arcblock/jwt';
import { toHex } from '@ocap/util';
import { TAnyObject, TSession } from '@did-connect/types';
import { fromRandom, fromSecretKey, WalletObject } from '@ocap/wallet';

type RequestArgs = {
  data: Partial<TSession>;
  wallet: WalletObject;
  url: string;
  method: string;
};

export const createSocketEndpoint = (baseUrl: string): string => {
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

export const createApiUrl = (baseUrl: string, sessionId: string, suffix = '/auth'): string => {
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

export const createDeepLink = (baseUrl: string, sessionId: string): string => {
  const tmp = new URL('https://abtwallet.io/i/');
  tmp.searchParams.set('action', 'requestAuth');
  tmp.searchParams.set('url', encodeURIComponent(createApiUrl(baseUrl, sessionId, '/auth')));
  return tmp.href;
};

export const doSignedRequest = async ({ data, wallet, url, method = 'POST' }: RequestArgs): Promise<TAnyObject> => {
  if (isEmpty(data)) {
    throw new Error('Can not update session with empty data');
  }
  const headers: TAnyObject = {};
  headers['x-updater-pk'] = wallet.publicKey;
  headers['x-updater-token'] = sign(wallet.address, wallet.secretKey as string, { hash: objectHash(data) });
  const res = await axios({ method, url, data, headers, timeout: 8000 });
  return res.data;
};

export const getUpdater = (): WalletObject => {
  // eslint-disable-next-line no-undef
  const sk = localStorage.getItem('updater-sk');
  if (sk) {
    return fromSecretKey(sk);
  }

  const updater = fromRandom();
  // eslint-disable-next-line no-undef
  localStorage.setItem('updater-sk', toHex(updater.secretKey));
  return updater;
};
