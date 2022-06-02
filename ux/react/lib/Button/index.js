"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ConnectButton;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _Button = _interopRequireDefault(require("@arcblock/ux/lib/Button"));

var _ConnectLogo = _interopRequireDefault(require("@arcblock/icons/lib/ConnectLogo"));

const _excluded = ["children"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * ConnectButton
 */
function ConnectButton(_ref) {
  let {
    children
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  return /*#__PURE__*/_react.default.createElement(_Button.default, Object.assign({
    color: "did",
    variant: "contained"
  }, rest), /*#__PURE__*/_react.default.createElement("span", {
    style: {
      fontWeight: 400
    }
  }, children || 'Continue With'), /*#__PURE__*/_react.default.createElement(_ConnectLogo.default, {
    style: {
      width: 'auto',
      height: '1.2em',
      margin: '0 4px 0 8px'
    }
  }));
}

ConnectButton.propTypes = {
  children: _propTypes.default.any
};
ConnectButton.defaultProps = {
  children: ''
};