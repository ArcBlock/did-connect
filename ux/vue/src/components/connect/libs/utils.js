import { Buffer } from 'buffer';
import { decodeConnectUrl, parseSessionId } from '../../session/utils';

export const providerName = 'wallet_url';

/**
 * 获取 web wallet url, 常用于为 did connect 组件传递 webWalletUrl 参数,
 * 更明确的说, 这里获取的应该是 **default web wallet url**,
 * 如果用户使用自定义的 web wallet url, 不应该使用该方法, 应该显式的将自定义的 web wallet url 传递给 did connect 组件
 * (参考: https://github.com/blocklet/ocap-playground/issues/98)
 *
 * 获取优先级:
 * - localStorage  使用 provider 注册
 * - env.webWalletUrl
 * - production web wallet url
 */
export function getWebWalletUrl(url) {
  return url || window.localStorage.getItem(providerName) || window.env?.webWalletUrl || 'https://web.abtwallet.io/';
}

export function getAppDid(publisher) {
  if (!publisher) {
    return '';
  }
  return publisher.split(':').pop();
}

// 检查 wallet url protocol 和当前页面地址的 protocol 是否一致
export const checkSameProtocol = (webWalletUrl) => {
  const { protocol } = window.location;
  let walletProtocol = '';
  try {
    walletProtocol = new URL(webWalletUrl).protocol;
  } catch (error) {
    walletProtocol = '';
  }
  return protocol === walletProtocol;
};

export function escape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
export function unescape(str) {
  return (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
}
export function encodeKey(key) {
  return escape(Buffer.from(key).toString('base64'));
}
export function decodeKey(str) {
  return Uint8Array.from(Buffer.from(unescape(str), 'base64'));
}

export function getExtraHeaders(baseUrl) {
  const headers = {};
  const authUrl = baseUrl || (window && window.location ? window.location.href : '');

  if (authUrl) {
    const { hostname, protocol, port } = new URL(authUrl);
    headers['x-real-hostname'] = hostname;
    headers['x-real-port'] = port;
    headers['x-real-protocol'] = protocol.endsWith(':') ? protocol.substring(0, protocol.length - 1) : protocol;
  }
  return headers;
}

// 从 url params 中获取已存在的 session (token & connect url)
export function parseExistingSession() {
  try {
    const url = new URL(window.location.href);
    const connectUrlParam = url.searchParams.get('__connect_url__');
    if (!connectUrlParam) {
      return null;
    }
    const connectUrl = decodeConnectUrl(connectUrlParam);
    const token = parseSessionId(connectUrl);
    return {
      token,
      url: connectUrl,
    };
  } catch (e) {
    return {
      error: e,
    };
  }
}
