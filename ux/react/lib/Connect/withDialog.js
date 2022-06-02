"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = withDialog;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _Dialog = _interopRequireDefault(require("@mui/material/Dialog"));

var _DialogContent = _interopRequireDefault(require("@mui/material/DialogContent"));

var _useMediaQuery = _interopRequireDefault(require("@mui/material/useMediaQuery"));

var _styles = require("@mui/styles");

var _Slide = _interopRequireDefault(require("@mui/material/Slide"));

var _useBrowser = _interopRequireDefault(require("@arcblock/react-hooks/lib/useBrowser"));

const _excluded = ["popup", "open", "dialogStyle", "responsive", "hideCloseButton"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const Transition = /*#__PURE__*/_react.default.forwardRef(function Transition(props, ref) {
  return /*#__PURE__*/_react.default.createElement(_Slide.default, Object.assign({
    direction: "up",
    ref: ref
  }, props));
}); // TODO: close dialog (close button) 时最好能调用 useToken#cancel


function withDialog(Component) {
  function WithDialogComponent(_ref) {
    let {
      popup,
      open,
      dialogStyle,
      responsive,
      hideCloseButton
    } = _ref,
        rest = _objectWithoutProperties(_ref, _excluded);

    const browser = (0, _useBrowser.default)();
    const theme = (0, _styles.useTheme)(); // 屏宽小于 sm 且在 mobile 设备中全屏显示 dialog (PC 端屏宽小于 sm 的情况正常弹窗, 不全屏显示)

    const isFullScreen = (0, _useMediaQuery.default)(theme.breakpoints.down('md')) && browser.mobile.any;

    if (!popup && !responsive) {
      return /*#__PURE__*/_react.default.createElement(Component, rest);
    } // replace deprecated disableBackdropClick/disableEscapeKeyDown with handleOnClose
    // eslint-disable-next-line no-unused-vars


    const handleOnClose = (e, reason) => {}; // 兼容 did-react 版本中存在的 onClose prop


    const handleClose = () => {
      if (rest.onClose) {
        rest.onClose();
      }
    }; // 兼容 did-react 版本中存在的 responsive prop, responsive=true 则让 dialog 始终保持 open 状态, 否则遵循外部传入的 open prop


    const isOpen = responsive ? true : open;
    return /*#__PURE__*/_react.default.createElement(_Dialog.default, Object.assign({
      open: isOpen,
      fullScreen: isFullScreen,
      maxWidth: "lg",
      onClose: handleOnClose // mobile 弹出面板相关

    }, isFullScreen && {
      TransitionComponent: Transition,
      PaperProps: {
        style: {
          background: 'transparent'
        }
      },
      style: {
        paddingTop: 44
      }
    }), /*#__PURE__*/_react.default.createElement(_DialogContent.default, {
      style: _objectSpread(_objectSpread({
        width: isFullScreen ? '100%' : 720,
        height: isFullScreen ? '100%' : 780,
        maxWidth: '100%',
        maxHeight: '100%',
        padding: 0
      }, dialogStyle), isFullScreen && {
        position: 'relative',
        // !修复 iOS safari 圆角问题
        borderRadius: '16px 16px 0 0',
        background: '#fff'
      })
    }, !hideCloseButton && /*#__PURE__*/_react.default.createElement(CloseButton, {
      onClick: handleClose
    }, "\xD7"), /*#__PURE__*/_react.default.createElement(Component, rest)));
  }

  WithDialogComponent.propTypes = {
    // deprecated: responsive 目的是兼容旧版本 (did-react), responsive=true 等价于 popup=true 和 open=true, 后续建议直接使用 popup 和 open
    // - 旧版本中 responsive=true 的思路是: 将 Auth 在 Dialog 中显示, 并且显示/隐藏完全由外部控制, 显示则渲染 Auth+Dialog 到 DOM 中, 隐藏则在 DOM 中清除 Auth+Dialog
    // - 新版本 (did-connect) 中 popup+open 的思路是: 导出 withDialog(Auth), 让 Auth 具有在弹出窗中显示的能力, 但是否在 Dialog 中显示取决于 popup prop 是否为 true,
    //   如果为 popup 为 true, 可以直接将 Auth 渲染到 DOM 中 (不需要外部控制), 外部通过传入 open state & onClose 来控制 Auth 的显示/隐藏 (或者说启用/关闭)
    responsive: _propTypes.default.bool,
    // 是否弹出显示, true 表示在 Dialog 中渲染, 并可以通过 open/onClose 控制 dialog 的显示/隐藏, false 表示直接渲染原内容
    popup: _propTypes.default.bool,
    open: _propTypes.default.bool,
    dialogStyle: _propTypes.default.object,
    hideCloseButton: _propTypes.default.bool
  };
  WithDialogComponent.defaultProps = {
    responsive: false,
    popup: false,
    open: false,
    dialogStyle: {},
    hideCloseButton: false
  };
  return WithDialogComponent;
}

const CloseButton = _styledComponents.default.div.withConfig({
  displayName: "withDialog__CloseButton",
  componentId: "sc-7zqjvr-0"
})(["position:absolute;top:1rem;right:1rem;z-index:999;color:#222222;font-size:2rem;line-height:1rem;cursor:pointer;user-select:none;"]);