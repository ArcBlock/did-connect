"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ResponsiveDidAddress;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _useMeasure = _interopRequireDefault(require("react-use/lib/useMeasure"));

var _didAddress = _interopRequireDefault(require("./did-address"));

const _excluded = ["style", "className", "component"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * 根据父容器宽度自动切换 compact 模式
 *
 * 实现逻辑:
 * - DidAddress 外层包裹一个容器, 其宽度自动撑满父容器宽度 (即这个容器需要是块级元素或 100% 宽的 inline-block)
 * - DidAddress 本身以 inlne 形式渲染 (方便探测 did-address 的 full-width)
 * - 组件 mounted 时记录 did address 的 full-width (非 compact 模式的宽度)
 * - 监听容器宽度变化, 当容器宽度变化时, 对比容器宽度和 did address full-width, => 切换 compact 模式
 * - TODO: 初始化时, 在确定是否应该以 compact 模式渲染前, 隐藏显示, 避免闪烁问题
 */
function ResponsiveDidAddress(_ref) {
  let {
    style,
    className,
    component
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  const [compact, setCompact] = _react.default.useState(false); // did address 完整显示时的宽度


  const [addressFullWidth, setAddressFullWidth] = _react.default.useState(null);

  const [containerRef, {
    width: containerWidth
  }] = (0, _useMeasure.default)();

  const ref = /*#__PURE__*/_react.default.createRef(); // 存储完整显示时 address 组件的宽度


  _react.default.useEffect(() => {
    if (!compact && addressFullWidth === null) {
      setAddressFullWidth(ref.current.offsetWidth);
    }
  }, []);

  _react.default.useEffect(() => {
    if (containerWidth && addressFullWidth) {
      setCompact(containerWidth < addressFullWidth);
    }
  }, [containerWidth, addressFullWidth]);

  return /*#__PURE__*/_react.default.createElement(Root, {
    as: component,
    inline: rest.inline,
    ref: containerRef,
    style: style,
    className: className
  }, /*#__PURE__*/_react.default.createElement(StyledDidAddress, Object.assign({}, rest, {
    component: component,
    inline: true,
    compact: compact,
    ref: ref
  })));
}

ResponsiveDidAddress.propTypes = {
  style: _propTypes.default.object,
  className: _propTypes.default.string,
  component: _propTypes.default.string
};
ResponsiveDidAddress.defaultProps = {
  style: {},
  className: '',
  component: 'span'
};

const Root = _styledComponents.default.div.withConfig({
  displayName: "responsive-did-address__Root",
  componentId: "sc-8pmbnl-0"
})(["display:block;overflow:hidden;", ""], _ref2 => {
  let {
    inline
  } = _ref2;
  return inline && "\n    display: inline-block;\n    width: 100%;\n  ";
});

const StyledDidAddress = (0, _styledComponents.default)(_didAddress.default).withConfig({
  displayName: "responsive-did-address__StyledDidAddress",
  componentId: "sc-8pmbnl-1"
})(["&&{max-width:none;}.did-address__text{white-space:nowrap;overflow:visible;text-overflow:unset;}"]);