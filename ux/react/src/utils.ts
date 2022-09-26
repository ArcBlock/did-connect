import Debug from 'debug';
import Cookie from 'js-cookie';
import { TAppInfo, TSession } from '@did-connect/types';
import { getCookieOptions } from '@arcblock/ux/lib/Util';

export const providerName = 'wallet_url';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const noop = (...args: any[]) => undefined;

const debug = Debug('@did-connect/react');

/**
 * 获取 web wallet url, 常用于为 did connect 组件传递 webWalletUrl 参数,
 * 更明确的说, 这里获取的应该是 **default web wallet url**,
 * 如果用户使用自定义的 web wallet url, 不应该使用该方法, 应该显式的将自定义的 web wallet url 传递给 did connect 组件
 * (参考: https://github.com/blocklet/ocap-playground/issues/98)
 *
 * 获取优先级:
 * - localStorage  使用 provider 注册
 * - blocklet.webWalletUrl
 * - env.webWalletUrl
 * - production web wallet url
 */
export const getWebWalletUrl = (): string => {
  return (
    window.localStorage.getItem(providerName) ||
    (window as any).blocklet?.webWalletUrl ||
    (window as any).env?.webWalletUrl ||
    'https://web.abtwallet.io/'
  );
};

// 检查 wallet url protocol 和当前页面地址的 protocol 是否一致
export const checkSameProtocol = (webWalletUrl: any): boolean => {
  const { protocol } = window.location;
  let walletProtocol = '';
  try {
    walletProtocol = new URL(webWalletUrl).protocol;
  } catch (error) {
    walletProtocol = '';
  }
  return protocol === walletProtocol;
};

// https://github.com/joaquimserafim/base64-url/blob/54d9c9ede66a8724f280cf24fd18c38b9a53915f/index.js#L10
function unescape(str: string): string {
  return (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
}
function escape(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// 如果需要 did-connect 加入一个已经存在的 session, 可以通过 url 传递一个 "__connect_url__" 查询参数, did-connect 会解析参数值中的 token 和 connect url 并加入该 session
// "__connect_url__" 需要编码/解码才可以正常使用
// 该方法只针对 browser 环境, nodejs 环境可以使用 escape(Buffer.from(url).toString('base64')) 进行编码
export const encodeConnectUrl = (url: string): string => {
  return escape(window.btoa(url));
};

export const decodeConnectUrl = (encoded: string): string => {
  return window.atob(unescape(encoded));
};

export const parseSessionId = (connectUrl: string): string => {
  const connectUrlObj = new URL(connectUrl);
  const url = decodeURIComponent(connectUrlObj.searchParams.get('url') || '');
  const token = new URL(url).searchParams.get('sid') || '';
  return token;
};

export const getAppId = (appInfo?: TAppInfo): string => {
  return appInfo
    ? appInfo.publisher?.replace('did:abt:', '')
    : (window as any).blocklet?.appId || (window as any).env?.appId || '';
};

export const updateConnectedInfo = (ctx: TSession): void => {
  const cookieOptions = getCookieOptions({ expireInDays: 7, returnDomain: false });
  debug('updateConnectedInfo', ctx.currentConnected);

  if (ctx.currentConnected) {
    // connected_did and connected_pk are used to skip authPrincipal
    Cookie.set('connected_did', ctx.currentConnected.userDid, cookieOptions);
    Cookie.set('connected_pk', ctx.currentConnected.userPk, cookieOptions);
    // connected_wallet_os is used to decide autoConnect target
    if (ctx.currentConnected.didwallet.os) {
      Cookie.set('connected_wallet_os', ctx.currentConnected.didwallet.os, cookieOptions);
    }
  }

  // connected_app is used to check session validity
  Cookie.set('connected_app', getAppId(ctx.appInfo), cookieOptions);
};

export const isSessionFinalized = (status: string): boolean =>
  ['error', 'canceled', 'rejected', 'completed'].includes(status);

export const isSessionActive = (status: string): boolean =>
  ['walletScanned', 'walletConnected', 'appConnected', 'walletApproved', 'appApproved'].includes(status);

export const isSessionLoading = (status: string): boolean => ['start', 'loading'].includes(status);
