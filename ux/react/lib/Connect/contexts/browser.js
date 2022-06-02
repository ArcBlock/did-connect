"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BrowserEnvContext = exports.BrowserEnvConsumer = void 0;
exports.BrowserEnvProvider = BrowserEnvProvider;
exports.useBrowserEnvContext = useBrowserEnvContext;

var _react = _interopRequireWildcard(require("react"));

var _useBrowser = _interopRequireDefault(require("@arcblock/react-hooks/lib/useBrowser"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * 浏览器环境 Context (方便在测试环境模拟浏览器环境)
 */
const BrowserEnvContext = /*#__PURE__*/_react.default.createContext({
  isWalletWebview: false,
  isMobile: false
});

exports.BrowserEnvContext = BrowserEnvContext;
const {
  Provider,
  Consumer
} = BrowserEnvContext; // eslint-disable-next-line react/prop-types

exports.BrowserEnvConsumer = Consumer;

function BrowserEnvProvider(_ref) {
  let {
    children
  } = _ref;
  const browser = (0, _useBrowser.default)();
  const value = {
    isWalletWebview: browser.wallet,
    isMobile: browser.mobile.any
  };
  return /*#__PURE__*/_react.default.createElement(Provider, {
    value: value
  }, children);
}

function useBrowserEnvContext() {
  return (0, _react.useContext)(BrowserEnvContext);
}