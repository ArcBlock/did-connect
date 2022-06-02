"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _didMotif = require("@arcblock/did-motif");

const _excluded = ["did", "size", "animation", "shape", "responsive"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function DIDMotif(_ref) {
  let {
    did,
    size,
    animation,
    shape,
    responsive
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  const svgRef = (0, _react.useRef)(null);
  (0, _react.useLayoutEffect)(() => {
    (0, _didMotif.update)(svgRef.current, did, {
      size,
      animation,
      shape
    });
  }, [did, size, shape]);

  if (responsive) {
    // fix avatar 显示问题 (safari 下父容器为 flex 时 inline svg 显示不出来, 需要明确指定 width)
    const styles = _objectSpread(_objectSpread({}, rest.style), {}, {
      width: '100%'
    });

    return /*#__PURE__*/_react.default.createElement("svg", Object.assign({
      ref: svgRef
    }, rest, {
      style: styles
    }));
  }

  return /*#__PURE__*/_react.default.createElement("span", Object.assign({}, rest, {
    style: _objectSpread({
      display: 'inline-block',
      width: size,
      height: size
    }, rest.style)
  }), /*#__PURE__*/_react.default.createElement("svg", {
    ref: svgRef
  }));
}

DIDMotif.propTypes = {
  did: _propTypes.default.string.isRequired,
  size: _propTypes.default.number,
  animation: _propTypes.default.bool,
  // 直接返回 svg 元素, svg 尺寸由父窗口决定 (撑满父窗口)
  responsive: _propTypes.default.bool,
  shape: _propTypes.default.number
};
DIDMotif.defaultProps = {
  size: 200,
  animation: false,
  responsive: false,
  shape: null
};
var _default = DIDMotif;
exports.default = _default;