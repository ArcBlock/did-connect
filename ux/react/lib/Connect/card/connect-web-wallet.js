"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ConnectWebWallet;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _Box = _interopRequireDefault(require("@mui/material/Box"));

var _Computer = _interopRequireDefault(require("@arcblock/icons/lib/Computer"));

var _card = require("./card");

var _refreshOverlay = _interopRequireDefault(require("./refresh-overlay"));

const _excluded = ["tokenState", "onRefresh", "webWalletUrl"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * ConnectWebWallet
 */
function ConnectWebWallet(_ref) {
  let {
    tokenState,
    onRefresh,
    webWalletUrl
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  const iconSize = rest.layout === 'lr' ? 48 : 64;
  const isTimeout = tokenState.status === 'timeout';
  const className = "".concat(rest.className || '', " ").concat(isTimeout ? 'card_timeout' : '');
  const url = new URL(webWalletUrl);

  const renderProvider = () => {
    var _window;

    const webWalletExtension = ((_window = window) === null || _window === void 0 ? void 0 : _window.ABT_DEV) || window.ABT;

    if (webWalletExtension && typeof webWalletExtension.open === 'function') {
      return /*#__PURE__*/_react.default.createElement(_Box.default, {
        mt: 0.5,
        fontSize: 12,
        style: {
          wordBreak: 'break-all'
        }
      }, "Web Wallet Extension");
    }

    if (webWalletUrl) {
      return /*#__PURE__*/_react.default.createElement(_Box.default, {
        mt: 0.5,
        fontSize: 12,
        style: {
          wordBreak: 'break-all'
        }
      }, url.hostname);
    }

    return null;
  };

  return /*#__PURE__*/_react.default.createElement(Root, Object.assign({}, rest, {
    color: "#A8B4C5",
    bgcolor: "#FFF",
    fontWeight: 700,
    className: className
  }), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_Box.default, {
    mt: 0.5,
    fontSize: 20,
    color: "#666"
  }, "Web Wallet"), renderProvider()), /*#__PURE__*/_react.default.createElement(_Computer.default, {
    style: {
      width: iconSize,
      height: iconSize
    }
  }), isTimeout && /*#__PURE__*/_react.default.createElement(_refreshOverlay.default, {
    onRefresh: onRefresh
  }));
}

ConnectWebWallet.propTypes = {
  tokenState: _propTypes.default.object.isRequired,
  onRefresh: _propTypes.default.func.isRequired,
  webWalletUrl: _propTypes.default.string
};
ConnectWebWallet.defaultProps = {
  webWalletUrl: ''
};
const Root = (0, _styledComponents.default)(_card.ResponsiveCard).withConfig({
  displayName: "connect-web-wallet__Root",
  componentId: "sc-1om8wl8-0"
})(["position:relative;cursor:pointer;&:not(.card_timeout):hover{background-color:#f2f8ff;svg{color:#4598fa;}}"]);