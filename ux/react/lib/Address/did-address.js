"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatAddress = exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

require("@fontsource/ubuntu-mono/400.css");

var _useMountedState = _interopRequireDefault(require("react-use/lib/useMountedState"));

var _Tooltip = _interopRequireDefault(require("@mui/material/Tooltip"));

var _colors = require("@mui/material/colors");

var _copyToClipboard = _interopRequireDefault(require("copy-to-clipboard"));

var _Copy = _interopRequireDefault(require("@arcblock/icons/lib/Copy"));

var _compactText = _interopRequireDefault(require("./compact-text"));

const _excluded = ["component", "size", "copyable", "content", "children", "prepend", "append", "compact", "startChars", "endChars", "locale"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const formatAddress = str => str.split(':').pop();

exports.formatAddress = formatAddress;
const translations = {
  en: {
    copy: 'Click To Copy',
    copied: 'Copied!'
  },
  zh: {
    copy: '点击复制',
    copied: '已复制!'
  }
};
/**
 * DidAddress 组件 (新版设计)
 *
 * - 样式调整
 * - click-to-copy 调整
 * - 长文本截断处理 (Ellipsis)
 * - 支持 inline 或 block 的显示方式
 * - 支持紧凑模式, 该模式下:
 *   - 占用宽度较小, 因此不考虑水平空间不够用的情况, 且忽略末尾省略号
 *   - 对于多层元素结构的 children, 保持元素结构, 将最内层 text 替换为 CompactText 组件
 *   - 为保证 copy 功能正常工作, 原 children 始终渲染, 但在紧凑式下会隐藏
 *   - 可配合 useMediaQuery 使用
 */

const DidAddress = /*#__PURE__*/(0, _react.forwardRef)((_ref, ref) => {
  let {
    component,
    size,
    copyable,
    content,
    children,
    prepend,
    append,
    compact,
    startChars,
    endChars,
    locale
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  if (!translations[locale]) {
    // eslint-disable-next-line no-param-reassign
    locale = 'en';
  } // 避免 unmounted 后 setTimeout handler 依然改变 state


  const isMounted = (0, _useMountedState.default)();
  const [copied, setCopied] = (0, _react.useState)(false);
  const textRef = (0, _react.useRef)();

  const onCopy = e => {
    e.stopPropagation();
    (0, _copyToClipboard.default)(content || textRef.current.textContent);
    setCopied(true); // 恢复 copied 状态

    setTimeout(() => {
      if (isMounted()) {
        setCopied(false);
      }
    }, 1500);
  };

  let copyElement = null;

  if (copyable) {
    copyElement = /*#__PURE__*/_react.default.createElement("span", {
      className: "did-address__copy-wrapper",
      title: copied ? '' : translations[locale].copy
    }, copied ? /*#__PURE__*/_react.default.createElement(_Tooltip.default, {
      title: translations[locale].copied,
      placement: "bottom",
      arrow: true,
      open: copied
    }, /*#__PURE__*/_react.default.createElement("i", {
      className: "fal fa-check did-address__copy",
      style: {
        color: _colors.green[500]
      }
    })) :
    /*#__PURE__*/

    /* title prop 直接加在 icon 上不生效 */
    _react.default.createElement(_Copy.default, {
      className: "did-address__copy",
      onClick: onCopy
    }));
  }

  return /*#__PURE__*/_react.default.createElement(Root, Object.assign({
    as: component,
    size: size
  }, rest, {
    ref: ref
  }), prepend, /*#__PURE__*/_react.default.createElement("span", {
    ref: textRef,
    className: "did-address__text did-address-truncate",
    style: {
      display: compact ? 'none' : 'inline'
    }
  }, children), compact && /*#__PURE__*/_react.default.createElement("span", {
    className: "did-address__text"
  }, /*#__PURE__*/_react.default.createElement(_compactText.default, {
    startChars: startChars,
    endChars: endChars
  }, children)), copyElement, append);
});
var _default = DidAddress;
exports.default = _default;
DidAddress.propTypes = {
  component: _propTypes.default.string,
  size: _propTypes.default.number,
  copyable: _propTypes.default.bool,
  children: _propTypes.default.any,
  content: _propTypes.default.string,
  inline: _propTypes.default.bool,
  prepend: _propTypes.default.any,
  append: _propTypes.default.any,
  // 紧凑模式
  compact: _propTypes.default.bool,
  startChars: _propTypes.default.number,
  endChars: _propTypes.default.number,
  locale: _propTypes.default.oneOf(['en', 'zh'])
};
DidAddress.defaultProps = {
  component: 'span',
  size: 0,
  copyable: true,
  children: null,
  content: '',
  inline: false,
  prepend: null,
  append: null,
  compact: false,
  startChars: 6,
  endChars: 6,
  locale: 'en'
};

const getFontSize = size => {
  // 12px 及以上的 size 有效, 否则返回 inherit
  if (size && Number(size) >= 12) {
    return "".concat(Number(size), "px");
  }

  return 'inherit';
};

const Root = _styledComponents.default.div.withConfig({
  displayName: "did-address__Root",
  componentId: "sc-j5rj89-0"
})(["font-family:'Ubuntu Mono',monospace;&&{display:", ";align-items:center;max-width:100%;overflow:hidden;color:#ccc;font-size:", ";font-weight:400;svg{fill:currentColor;}}.did-address__text{color:#666;}.did-address-truncate{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.did-address__logo,.did-address__copy{flex:0 0 auto;}.did-address__logo{margin-right:8px;color:#ccc;}.did-address__copy-wrapper{display:flex;justify-content:center;align-items:center;width:1em;height:1em;margin-left:8px;}.did-address__copy{width:auto;height:1em;color:#999;cursor:pointer;}a{color:#666;}&:hover a{color:#222;text-decoration:underline;}"], _ref2 => {
  let {
    inline
  } = _ref2;
  return inline ? 'inline-flex' : 'flex';
}, props => getFontSize(props.size));