export function getAppId(appInfo) {
  return appInfo ? appInfo.publisher.replace('did:abt:', '') : window.blocklet?.appId || window.env?.appId || '';
}

export function getPath() {
  let path = '/';

  if (typeof window !== 'undefined') {
    const env = window.env || {};
    const blocklet = window.blocklet || {};

    path = env.groupPathPrefix || blocklet.groupPrefix || blocklet.prefix || '';
    path = path.replace(/\/+$/, '');
    path = path || '/';
  }
  return path;
}

// 如果需要 did-connect 加入一个已经存在的 session, 可以通过 url 传递一个 "__connect_url__" 查询参数, did-connect 会解析参数值中的 token 和 connect url 并加入该 session
// "__connect_url__" 需要编码/解码才可以正常使用
// 该方法只针对 browser 环境, nodejs 环境可以使用 escape(Buffer.from(url).toString('base64')) 进行编码
export const encodeConnectUrl = (url) => {
  return escape(window.btoa(url));
};
export const decodeConnectUrl = (encoded) => {
  return window.atob(unescape(encoded));
};

// connectUrl 对应 create token 响应数据中的 url 字段值
export const parseSessionId = (connectUrl) => {
  const connectUrlObj = new URL(connectUrl);
  const url = decodeURIComponent(connectUrlObj.searchParams.get('url'));
  const token = new URL(url).searchParams.get('_t_');
  return token;
};

// https://github.com/joaquimserafim/base64-url/blob/54d9c9ede66a8724f280cf24fd18c38b9a53915f/index.js#L10
function unescape(str) {
  return (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
}
function escape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
