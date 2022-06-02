"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withWebWalletSWKeeper = exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _useIdle = _interopRequireDefault(require("react-use/lib/useIdle"));

var _useLocalStorage = _interopRequireDefault(require("react-use/lib/useLocalStorage"));

var _utils = require("../utils");

const _excluded = ["webWalletUrl", "maxIdleTime"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

// 默认最大空闲时间: 30min
const DEFAULT_MAX_IDLE_TIME = 1000 * 60 * 30; // 可使用 localStorage.setItem('wallet_sw_keeper_disabled', 1) 来禁用嵌入 wallet iframe

const STORAGE_KEY_DISABLED = 'wallet_sw_keeper_disabled'; // iframe id, 如果存在多个 WebWalletSWKeeper 组件实例, 共享此 id, 保证只有一个 iframe

let id;

const injectIframe = webWalletUrl => {
  const iframe = document.createElement('iframe');
  iframe.id = id;
  iframe.style.width = 0;
  iframe.style.height = 0;
  iframe.style.border = 0; // https://stackoverflow.com/questions/27858989/iframe-with-0-height-creates-a-gap

  iframe.style.display = 'block'; // fix: 页面自动滚动到底部问题 (https://github.com/blocklet/abt-wallet/issues/1160)
  //      top: 0 可能不是必须的, 但测试中发现, 如果不设置, 在某些特殊情况下似乎也会导致页面自动滚动到底部

  iframe.style.position = 'absolute';
  iframe.style.top = 0;
  iframe.src = "".concat(webWalletUrl, "?action=iframe");
  document.body.appendChild(iframe);
};

const removeIframe = () => {
  const iframe = document.getElementById(id);

  if (iframe) {
    document.body.removeChild(iframe);
  }
};

const cleanup = () => {
  removeIframe();
  id = null;
};

const enable = webWalletUrl => {
  if (!id) {
    id = "web_wallet_sw_keeper_".concat(Date.now());
    injectIframe(webWalletUrl);
  }
}; // 该组件通过嵌入一个 web wallet iframe 帮助 web wallet service worker 延最大空闲时间


function WebWalletSWKeeper(_ref) {
  let {
    webWalletUrl,
    maxIdleTime
  } = _ref;
  const isIdle = (0, _useIdle.default)(maxIdleTime); // 用户操作空闲时间超过 maxIdleTime 时禁用, 活跃时启用

  (0, _react.useEffect)(() => {
    if (isIdle) {
      cleanup();
    } else {
      enable(webWalletUrl);
    }
  }, [isIdle]); // 组件销毁时自动清理

  (0, _react.useEffect)(() => () => cleanup(), []);
  return null;
}

WebWalletSWKeeper.propTypes = {
  webWalletUrl: _propTypes.default.string.isRequired,
  maxIdleTime: _propTypes.default.number
};
WebWalletSWKeeper.defaultProps = {
  maxIdleTime: DEFAULT_MAX_IDLE_TIME
};
var _default = WebWalletSWKeeper;
exports.default = _default;

const withWebWalletSWKeeper = Component => {
  // eslint-disable-next-line react/prop-types
  return function WithWebWalletSWKeeperComponent(_ref2) {
    let {
      webWalletUrl,
      maxIdleTime
    } = _ref2,
        rest = _objectWithoutProperties(_ref2, _excluded);

    // eslint-disable-next-line no-param-reassign
    webWalletUrl = webWalletUrl || (0, _utils.getWebWalletUrl)();
    const [disabled] = (0, _useLocalStorage.default)(STORAGE_KEY_DISABLED);
    const webWalletExtension = window.ABT_DEV || window.ABT;
    const isSameProtocol = (0, _utils.checkSameProtocol)(webWalletUrl); // 以下几种情况不会嵌入 wallet iframe :
    // - 通过设置 localStorage#wallet_sw_keeper_disabled = 1 明确禁止 (开发调试过程中可以使用, 避免控制台打印一堆日志影响调试)
    // - 检查到 wallet 浏览器插件
    // - webWalletUrl 与当前页面 url 的 protocol 不同

    return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, !disabled && !webWalletExtension && isSameProtocol && /*#__PURE__*/_react.default.createElement(WebWalletSWKeeper, {
      webWalletUrl: webWalletUrl,
      maxIdleTime: maxIdleTime
    }), /*#__PURE__*/_react.default.createElement(Component, Object.assign({
      webWalletUrl: webWalletUrl
    }, rest)));
  };
};

exports.withWebWalletSWKeeper = withWebWalletSWKeeper;