"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Status;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _Box = _interopRequireDefault(require("@mui/material/Box"));

var _Button = _interopRequireDefault(require("@mui/material/Button"));

var _Check = _interopRequireDefault(require("@mui/icons-material/Check"));

var _Clear = _interopRequireDefault(require("@mui/icons-material/Clear"));

var _Connect = _interopRequireDefault(require("@arcblock/icons/lib/Connect"));

var _DidWalletLogo = _interopRequireDefault(require("@arcblock/icons/lib/DidWalletLogo"));

var _locale = _interopRequireDefault(require("../assets/locale"));

var _card = _interopRequireDefault(require("./card"));

const _excluded = ["status", "onCancel", "onRetry", "messages", "locale"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const StyledButton = (0, _styledComponents.default)(_Button.default).withConfig({
  displayName: "status__StyledButton",
  componentId: "sc-1sm0161-0"
})(["&&{padding:4px 16px;color:#4598fa;background-color:#eaf4ff;&:hover{color:#fff;background-color:#4598fa;}}"]);
/**
 * Status (scanned/succeed/error)
 */

function Status(_ref) {
  let {
    status,
    onCancel,
    onRetry,
    messages,
    locale
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  return /*#__PURE__*/_react.default.createElement(Root, rest, status === 'scanned' && /*#__PURE__*/_react.default.createElement(_Box.default, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  }, /*#__PURE__*/_react.default.createElement(_Box.default, null, /*#__PURE__*/_react.default.createElement(_Connect.default, {
    style: {
      width: 48,
      height: 48,
      fill: '#4598FA'
    }
  })), /*#__PURE__*/_react.default.createElement(_Box.default, {
    mt: 2,
    lineHeight: "34px",
    color: "#4598fa",
    fontSize: 24,
    textAlign: "center",
    fontWeight: 400
  }, _locale.default[locale].scanned), /*#__PURE__*/_react.default.createElement(_Box.default, {
    mt: 1.5,
    display: "flex",
    alignItems: "center"
  }, /*#__PURE__*/_react.default.createElement(_Box.default, {
    color: "#a8b4c5",
    fontSize: 16,
    fontWeight: 400
  }, _locale.default[locale].connected), /*#__PURE__*/_react.default.createElement(_DidWalletLogo.default, {
    style: {
      height: '1em',
      marginLeft: 8
    }
  })), /*#__PURE__*/_react.default.createElement(_Box.default, {
    mt: 5
  }, /*#__PURE__*/_react.default.createElement(StyledButton, {
    onClick: () => onCancel()
  }, _locale.default[locale].back))), status === 'succeed' && /*#__PURE__*/_react.default.createElement(_Box.default, {
    textAlign: "center",
    className: "status--succeed"
  }, /*#__PURE__*/_react.default.createElement("span", {
    className: "status_icon"
  }, /*#__PURE__*/_react.default.createElement(_Check.default, null)), /*#__PURE__*/_react.default.createElement(_Box.default, {
    component: "p",
    className: "status_icon-text"
  }, _locale.default[locale].success), /*#__PURE__*/_react.default.createElement(_Box.default, {
    component: "p",
    className: "status_desc"
  }, messages.success)), status === 'error' && /*#__PURE__*/_react.default.createElement(_Box.default, {
    textAlign: "center",
    className: "status--error"
  }, /*#__PURE__*/_react.default.createElement("span", {
    className: "status_icon"
  }, /*#__PURE__*/_react.default.createElement(_Clear.default, null)), /*#__PURE__*/_react.default.createElement(_Box.default, {
    component: "p",
    className: "status_icon-text"
  }, _locale.default[locale].failed), /*#__PURE__*/_react.default.createElement(_Box.default, {
    component: "p",
    className: "status_desc"
  }, messages.error || _locale.default[locale].error), /*#__PURE__*/_react.default.createElement(_Box.default, {
    mt: 5
  }, /*#__PURE__*/_react.default.createElement(StyledButton, {
    onClick: onRetry
  }, _locale.default[locale].retry))));
}

Status.propTypes = {
  status: _propTypes.default.string,
  onCancel: _propTypes.default.func,
  onRetry: _propTypes.default.func,
  messages: _propTypes.default.shape({
    confirm: _propTypes.default.string.isRequired,
    // scanned
    success: _propTypes.default.any.isRequired,
    error: _propTypes.default.any.isRequired
  }).isRequired,
  locale: _propTypes.default.oneOf(['en', 'zh'])
};
Status.defaultProps = {
  status: '',
  onCancel: () => {},
  onRetry: () => {},
  locale: 'en'
};
const Root = (0, _styledComponents.default)(_card.default).withConfig({
  displayName: "status__Root",
  componentId: "sc-1sm0161-1"
})(["display:flex;justify-content:center;align-items:center;color:#a8b4c5;border:0;border-radius:0;background-color:transparent;.status_icon{display:inline-flex;justify-content:center;align-items:center;width:48px;height:48px;border-radius:100%;color:#fff;}.status_icon-text{margin:16px 0;font-size:24px;font-weight:400;}.status_desc{overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;font-size:14px;}.status--succeed{.status_icon{background-color:#3ab39d;}.status_icon-text{color:#3ab39d;}}.status--error{.status_icon{background-color:#f16e6e;}.status_icon-text{color:#f16e6e;}.status_desc{word-break:break-all;}}}.text-wallet{color:#334660;font-size:14px;font-weight:700;}"]);