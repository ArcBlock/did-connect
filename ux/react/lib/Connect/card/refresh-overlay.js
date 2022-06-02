"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = RefreshOverlay;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _Refresh = _interopRequireDefault(require("@mui/icons-material/Refresh"));

const _excluded = ["onRefresh"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

// 需要父元素设置 relative position
function RefreshOverlay(_ref) {
  let {
    onRefresh
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  const handleOnRefresh = e => {
    e.stopPropagation();
    onRefresh();
  };

  return /*#__PURE__*/_react.default.createElement(Root, Object.assign({}, rest, {
    onClick: handleOnRefresh
  }), /*#__PURE__*/_react.default.createElement("span", null, /*#__PURE__*/_react.default.createElement(_Refresh.default, null)));
}

const Root = _styledComponents.default.div.withConfig({
  displayName: "refresh-overlay__Root",
  componentId: "sc-1g1gxyk-0"
})(["position:absolute;top:0;bottom:0;left:0;right:0;display:flex;justify-content:center;align-items:center;background-color:rgba(0,0,0,0.1);cursor:pointer;> span{display:inline-flex;justify-content:center;align-items:center;width:48px;height:48px;border-radius:100%;color:#fff;background-color:#4598fa;}.MuiSvgIcon-root{font-size:28px;}"]);

RefreshOverlay.propTypes = {
  onRefresh: _propTypes.default.func.isRequired
};