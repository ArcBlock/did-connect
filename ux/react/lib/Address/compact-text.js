"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = CompactText;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

const _excluded = ["children"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

// 递归, 将 text (string) 部分替换为 CompactText (保持元素结构)
// eslint-disable-next-line react/prop-types
function RecursiveWrapper(_ref) {
  let {
    children
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  const wrappedChildren = _react.default.Children.map(children, child => {
    if (typeof child === 'string') {
      return /*#__PURE__*/_react.default.createElement(CompactText, rest, child);
    }

    if (child.props && child.props.children) {
      return /*#__PURE__*/_react.default.createElement(child.type, child.props, /*#__PURE__*/_react.default.createElement(RecursiveWrapper, null, child.props.children));
    }

    return child;
  });

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, wrappedChildren);
}
/**
 * 紧凑文本组件 (显示首尾, 中间截断显示省略号), 仅考虑等宽字体的情况
 */


function CompactText(_ref2) {
  let {
    startChars,
    endChars,
    children
  } = _ref2;

  if (typeof children !== 'string') {
    return /*#__PURE__*/_react.default.createElement(RecursiveWrapper, {
      startChars: startChars,
      endChars: endChars
    }, children);
  }

  return /*#__PURE__*/_react.default.createElement("span", null, children.slice(0, startChars), "...", children.slice(children.length - endChars));
}

CompactText.propTypes = {
  startChars: _propTypes.default.number,
  endChars: _propTypes.default.number,
  children: _propTypes.default.node.isRequired
};
CompactText.defaultProps = {
  startChars: 6,
  endChars: 6
};