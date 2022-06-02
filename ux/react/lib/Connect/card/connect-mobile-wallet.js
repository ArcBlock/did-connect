"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ConnectMobileWallet;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _Box = _interopRequireDefault(require("@mui/material/Box"));

var _Mobile = _interopRequireDefault(require("@arcblock/icons/lib/Mobile"));

var _card = require("./card");

var _refreshOverlay = _interopRequireDefault(require("./refresh-overlay"));

const _excluded = ["tokenState", "onRefresh", "deepLink"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * ConnectMobileWallet
 *
 * - mobile browser 环境会显示 (该情况下文案改成了 Open With ...)
 * - wallet webview 环境会显示, 该情况下实际上没有机会显示, 因为 token created 时会自动唤起 mobile auth
 */
function ConnectMobileWallet(_ref) {
  let {
    tokenState,
    onRefresh,
    deepLink
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  const iconSize = rest.layout === 'lr' ? [20, 34] : [40, 68];

  const linkRef = _react.default.useRef();

  return /*#__PURE__*/_react.default.createElement(Root, Object.assign({}, rest, {
    color: "#A8B4C5",
    fontWeight: 700,
    onClick: () => linkRef.current.click()
  }), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_Box.default, {
    fontSize: 16
  }, "Open In"), /*#__PURE__*/_react.default.createElement(_Box.default, {
    mt: 0.5,
    fontSize: 20,
    color: "#334660"
  }, "Mobile Wallet")), /*#__PURE__*/_react.default.createElement(_Mobile.default, {
    style: {
      width: iconSize[0],
      height: iconSize[1]
    }
  }), tokenState.status === 'timeout' && /*#__PURE__*/_react.default.createElement(_refreshOverlay.default, {
    onRefresh: onRefresh
  }), /*#__PURE__*/_react.default.createElement("a", {
    href: deepLink,
    target: "_blank",
    ref: linkRef,
    style: {
      display: 'none'
    },
    rel: "noreferrer"
  }, "link"));
}

const Root = (0, _styledComponents.default)(_card.ResponsiveCard).withConfig({
  displayName: "connect-mobile-wallet__Root",
  componentId: "sc-1cf5qgn-0"
})(["position:relative;cursor:pointer;"]);
ConnectMobileWallet.propTypes = {
  tokenState: _propTypes.default.object.isRequired,
  onRefresh: _propTypes.default.func.isRequired,
  deepLink: _propTypes.default.string.isRequired
};