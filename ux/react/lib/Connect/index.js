"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _token = _interopRequireDefault(require("./hooks/token"));

var _basic = _interopRequireDefault(require("./basic"));

var _browser = require("./contexts/browser");

var _withDialog = _interopRequireDefault(require("./withDialog"));

var _WebWalletSWKeeper = require("../WebWalletSWKeeper");

require("@fontsource/lato/400.css");

require("@fontsource/lato/700.css");

const _excluded = ["onClose", "onSuccess", "onError", "action", "prefix", "socketUrl", "checkFn", "checkInterval", "checkTimeout", "extraParams", "locale", "tokenKey", "encKey", "baseUrl", "enableAutoConnect"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * - 将 token state (useToken) 提升到这里 (提升 BasicConnect 上层, 方便 BasicConnect 独立测试)
 */
function Connect(_ref) {
  let {
    onClose,
    onSuccess,
    onError,
    action,
    prefix,
    socketUrl,
    checkFn,
    checkInterval,
    checkTimeout,
    extraParams,
    locale,
    tokenKey,
    encKey,
    baseUrl,
    enableAutoConnect
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  if (typeof checkFn !== 'function') {
    throw new Error('Cannot initialize did connect component without a fetchFn');
  }

  const {
    state,
    generate,
    cancelWhenScanned
  } = (0, _token.default)({
    action,
    baseUrl,
    checkFn,
    checkInterval,
    checkTimeout,
    extraParams,
    prefix,
    socketUrl,
    onClose,
    onError,
    onSuccess,
    locale,
    tokenKey,
    encKey,
    enableAutoConnect
  });

  const connectProps = _objectSpread(_objectSpread({}, rest), {}, {
    tokenState: state,
    generate,
    cancelWhenScanned,
    locale,
    tokenKey,
    encKey
  });

  return /*#__PURE__*/_react.default.createElement(_browser.BrowserEnvProvider, null, /*#__PURE__*/_react.default.createElement(_basic.default, connectProps));
}

Connect.propTypes = {
  onClose: _propTypes.default.func,
  onError: _propTypes.default.func,
  onSuccess: _propTypes.default.func.isRequired,
  action: _propTypes.default.string.isRequired,
  checkFn: _propTypes.default.func.isRequired,
  prefix: _propTypes.default.string,
  socketUrl: _propTypes.default.string,
  checkInterval: _propTypes.default.number,
  checkTimeout: _propTypes.default.number,
  extraParams: _propTypes.default.object,
  locale: _propTypes.default.oneOf(['en', 'zh']),
  tokenKey: _propTypes.default.string,
  encKey: _propTypes.default.string,
  baseUrl: _propTypes.default.string,
  enableAutoConnect: _propTypes.default.bool
};
Connect.defaultProps = {
  prefix: '/api/did',
  socketUrl: '',
  onClose: () => {},
  onError: () => {},
  checkInterval: 2000,
  checkTimeout: 60000,
  // 1 minute
  extraParams: {},
  locale: 'en',
  tokenKey: '_t_',
  encKey: '_ek_',
  baseUrl: '',
  enableAutoConnect: true
};

var _default = (0, _WebWalletSWKeeper.withWebWalletSWKeeper)((0, _withDialog.default)(Connect));

exports.default = _default;