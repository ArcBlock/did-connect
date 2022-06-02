"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResponsiveCard = ResponsiveCard;
exports.default = Card;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _Box = _interopRequireDefault(require("@mui/material/Box"));

const _excluded = ["children"],
      _excluded2 = ["children", "layout"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * Card
 */
function Card(_ref) {
  let {
    children
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  return /*#__PURE__*/_react.default.createElement(Root, rest, children);
}

const Root = (0, _styledComponents.default)(_Box.default).withConfig({
  displayName: "card__Root",
  componentId: "sc-n6f61v-0"
})(["display:inline-block;padding:16px;overflow:hidden;border:1px solid #f0f0f0;border-radius:12px;background-color:#fff;transform:translateZ(0);"]);
Card.propTypes = {
  children: _propTypes.default.any.isRequired
}; // ResponsiveCard, 支持两种布局: 上下, 左右 (适用于移动端)

function ResponsiveCard(_ref2) {
  let {
    children,
    layout
  } = _ref2,
      rest = _objectWithoutProperties(_ref2, _excluded2);

  if (!children) {
    return null;
  }

  const [child1, child2, ...extras] = children;
  return /*#__PURE__*/_react.default.createElement(ResponsiveCardRoot, Object.assign({
    layout: layout
  }, rest), /*#__PURE__*/_react.default.createElement("div", null, child1), /*#__PURE__*/_react.default.createElement("div", null, child2), extras);
}

ResponsiveCard.propTypes = {
  // 两种布局: 上下, 左右 (适用于移动端)
  layout: _propTypes.default.oneOf(['tb', 'lr']),
  children: _propTypes.default.any
};
ResponsiveCard.defaultProps = {
  layout: 'tb',
  children: null
};
const ResponsiveCardRoot = (0, _styledComponents.default)(Card).withConfig({
  displayName: "card__ResponsiveCardRoot",
  componentId: "sc-n6f61v-1"
})(["display:flex;flex-direction:", ";justify-content:space-between;> div{flex:0 0 auto;", "}", ""], props => props.layout === 'tb' ? 'column' : 'row', props => props.layout === 'lr' ? 'align-self: center;' : '', _ref3 => {
  let {
    layout
  } = _ref3;
  return layout !== 'tb' && "\n      > div:first-child {\n        flex-shrink: 1;\n        min-width: 80px;\n        margin-right: 8px;\n      }\n    ";
});