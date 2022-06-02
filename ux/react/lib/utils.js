"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateConnectedInfo = exports.providerName = exports.parseTokenFromConnectUrl = exports.getWebWalletUrl = exports.getAppId = exports.encodeConnectUrl = exports.decodeConnectUrl = exports.checkSameProtocol = void 0;

var _Util = require("@arcblock/ux/lib/Util");

var _jsCookie = _interopRequireDefault(require("js-cookie"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable import/prefer-default-export */
const providerName = 'wallet_url';
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

exports.providerName = providerName;

const getWebWalletUrl = () => {
  var _window$env;

  return window.localStorage.getItem(providerName) || ((_window$env = window.env) === null || _window$env === void 0 ? void 0 : _window$env.webWalletUrl) || 'https://web.abtwallet.io/';
}; // 检查 wallet url protocol 和当前页面地址的 protocol 是否一致


exports.getWebWalletUrl = getWebWalletUrl;

const checkSameProtocol = webWalletUrl => {
  const {
    protocol
  } = window.location;
  let walletProtocol = '';

  try {
    walletProtocol = new URL(webWalletUrl).protocol;
  } catch (error) {
    walletProtocol = '';
  }

  return protocol === walletProtocol;
}; // https://github.com/joaquimserafim/base64-url/blob/54d9c9ede66a8724f280cf24fd18c38b9a53915f/index.js#L10


exports.checkSameProtocol = checkSameProtocol;

function unescape(str) {
  return (str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/');
}

function escape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
} // 如果需要 did-connect 加入一个已经存在的 session, 可以通过 url 传递一个 "__connect_url__" 查询参数, did-connect 会解析参数值中的 token 和 connect url 并加入该 session
// "__connect_url__" 需要编码/解码才可以正常使用
// 该方法只针对 browser 环境, nodejs 环境可以使用 escape(Buffer.from(url).toString('base64')) 进行编码


const encodeConnectUrl = url => {
  return escape(window.btoa(url));
};

exports.encodeConnectUrl = encodeConnectUrl;

const decodeConnectUrl = encoded => {
  return window.atob(unescape(encoded));
}; // connectUrl 对应 create token 响应数据中的 url 字段值


exports.decodeConnectUrl = decodeConnectUrl;

const parseTokenFromConnectUrl = connectUrl => {
  const connectUrlObj = new URL(connectUrl);
  const url = decodeURIComponent(connectUrlObj.searchParams.get('url'));
  const token = new URL(url).searchParams.get('_t_');
  return token;
};

exports.parseTokenFromConnectUrl = parseTokenFromConnectUrl;

const getAppId = appInfo => {
  var _window$blocklet, _window$env2;

  return appInfo ? appInfo.publisher.replace('did:abt:', '') : ((_window$blocklet = window.blocklet) === null || _window$blocklet === void 0 ? void 0 : _window$blocklet.appId) || ((_window$env2 = window.env) === null || _window$env2 === void 0 ? void 0 : _window$env2.appId) || '';
};

exports.getAppId = getAppId;

const updateConnectedInfo = data => {
  var _data$connectedWallet;

  const cookieOptions = (0, _Util.getCookieOptions)({
    expireInDays: 7,
    returnDomain: false
  }); // connected_did and connected_pk are used to skip authPrincipal

  _jsCookie.default.set('connected_did', data.did || '', cookieOptions);

  _jsCookie.default.set('connected_pk', data.pk || '', cookieOptions); // connected_app is used to check session validity


  _jsCookie.default.set('connected_app', getAppId(data.appInfo), cookieOptions);

  if ((_data$connectedWallet = data.connectedWallet) !== null && _data$connectedWallet !== void 0 && _data$connectedWallet.os) {
    _jsCookie.default.set('connected_wallet_os', data.connectedWallet.os, cookieOptions);
  }
};

exports.updateConnectedInfo = updateConnectedInfo;