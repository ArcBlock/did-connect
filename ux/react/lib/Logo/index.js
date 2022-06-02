"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = DidLogo;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _DidLogo = _interopRequireDefault(require("@arcblock/icons/lib/DidLogo"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const defaultStyle = {
  width: 'auto',
  height: '1em',
  fill: 'currentColor'
};

function DidLogo(_ref) {
  let {
    style,
    size,
    className
  } = _ref;
  const height = Number(size) > 0 ? "".concat(Number(size), "px") : size;
  return /*#__PURE__*/_react.default.createElement(_DidLogo.default, {
    className: "".concat(className).trim(),
    style: Object.assign({}, defaultStyle, style, height ? {
      height
    } : {})
  });
}

DidLogo.propTypes = {
  style: _propTypes.default.object,
  size: _propTypes.default.oneOfType([_propTypes.default.string, _propTypes.default.number]),
  className: _propTypes.default.string
};
DidLogo.defaultProps = {
  style: defaultStyle,
  size: 0,
  className: ''
};