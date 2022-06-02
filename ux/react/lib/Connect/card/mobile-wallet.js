"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = MobileWallet;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _Box = _interopRequireDefault(require("@mui/material/Box"));

var _QRCode = _interopRequireDefault(require("@arcblock/ux/lib/QRCode"));

var _card = require("./card");

var _refreshOverlay = _interopRequireDefault(require("./refresh-overlay"));

const _excluded = ["qrcodeSize", "tokenState", "onRefresh"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * MobileWallet (QRCode scanning)
 */
function MobileWallet(_ref) {
  let {
    qrcodeSize,
    tokenState,
    onRefresh
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  return /*#__PURE__*/_react.default.createElement(_card.ResponsiveCard, Object.assign({}, rest, {
    position: "relative",
    color: "#A8B4C5",
    fontWeight: 700,
    status: tokenState.status
  }), /*#__PURE__*/_react.default.createElement("div", null, /*#__PURE__*/_react.default.createElement(_Box.default, {
    mt: 0.5,
    fontSize: 20,
    color: "#666"
  }, "Mobile Wallet")), /*#__PURE__*/_react.default.createElement(_QRCode.default, {
    data: tokenState.url,
    size: qrcodeSize
  }), tokenState.status === 'timeout' && /*#__PURE__*/_react.default.createElement(_refreshOverlay.default, {
    onRefresh: onRefresh
  }));
}

MobileWallet.propTypes = {
  tokenState: _propTypes.default.object.isRequired,
  qrcodeSize: _propTypes.default.number.isRequired,
  onRefresh: _propTypes.default.func.isRequired
};