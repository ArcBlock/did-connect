"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatAddress = exports.default = void 0;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _didAddress = _interopRequireDefault(require("./did-address"));

var _responsiveDidAddress = _interopRequireDefault(require("./responsive-did-address"));

const _excluded = ["responsive"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const formatAddress = str => str.split(':').pop();

exports.formatAddress = formatAddress;

const DidAddressWrapper = _ref => {
  let {
    responsive
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  if (responsive) {
    return /*#__PURE__*/_react.default.createElement(_responsiveDidAddress.default, rest);
  }

  return /*#__PURE__*/_react.default.createElement(_didAddress.default, rest);
};

var _default = DidAddressWrapper;
exports.default = _default;
DidAddressWrapper.propTypes = {
  responsive: _propTypes.default.bool
};
DidAddressWrapper.defaultProps = {
  responsive: true
};