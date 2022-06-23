import Cookie from 'js-cookie';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import { getCookieOptions } from '@arcblock/ux/lib/Util';

export const providerName = 'wallet_url';

export const noop = () => null;

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
export const getWebWalletUrl = () => {
  return (
    window.localStorage.getItem(providerName) ||
    (window as any).blocklet?.webWalletUrl ||
    (window as any).env?.webWalletUrl ||
    'https://web.abtwallet.io/'
  );
};

// 检查 wallet url protocol 和当前页面地址的 protocol 是否一致
export const checkSameProtocol = (webWalletUrl: any) => {
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
function unescape(str: any) {
  return (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
}
function escape(str: any) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// 如果需要 did-connect 加入一个已经存在的 session, 可以通过 url 传递一个 "__connect_url__" 查询参数, did-connect 会解析参数值中的 token 和 connect url 并加入该 session
// "__connect_url__" 需要编码/解码才可以正常使用
// 该方法只针对 browser 环境, nodejs 环境可以使用 escape(Buffer.from(url).toString('base64')) 进行编码
export const encodeConnectUrl = (url: any) => {
  return escape(window.btoa(url));
};

export const decodeConnectUrl = (encoded: any) => {
  return window.atob(unescape(encoded));
};

// connectUrl 对应 create token 响应数据中的 url 字段值
export const parseTokenFromConnectUrl = (connectUrl: any) => {
  const connectUrlObj = new URL(connectUrl);
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string | null' is not assignable... Remove this comment to see the full error message
  const url = decodeURIComponent(connectUrlObj.searchParams.get('url'));
  const token = new URL(url).searchParams.get('_t_');
  return token;
};

export const getAppId = (appInfo: any) => {
  return appInfo
    ? appInfo.publisher.replace('did:abt:', '')
    : (window as any).blocklet?.appId || (window as any).env?.appId || '';
};

export const updateConnectedInfo = (ctx: any) => {
  const cookieOptions = getCookieOptions({ expireInDays: 7, returnDomain: false });

  // connected_did and connected_pk are used to skip authPrincipal
  Cookie.set('connected_did', ctx.connectedUser.userDid || '', cookieOptions);
  Cookie.set('connected_pk', ctx.connectedUser.userPk || '', cookieOptions);

  // connected_app is used to check session validity
  Cookie.set('connected_app', getAppId(ctx.appInfo), cookieOptions);

  // connected_wallet_os is used to decide autoConnect target
  if (ctx.connectedUser.wallet?.os) {
    Cookie.set('connected_wallet_os', ctx.connectedUser.wallet.os, cookieOptions);
  }
};

export const isSessionFinalized = (status: any) => ['error', 'canceled', 'rejected', 'completed'].includes(status);

export const isSessionActive = (status: any) =>
  ['walletScanned', 'walletConnected', 'appConnected', 'walletApproved', 'appApproved'].includes(status);

export const isSessionLoading = (status: any) => ['start', 'loading'].includes(status);
