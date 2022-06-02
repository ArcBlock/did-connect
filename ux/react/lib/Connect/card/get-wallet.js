"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = GetWallet;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _styledComponents = _interopRequireDefault(require("styled-components"));

var _Box = _interopRequireDefault(require("@mui/material/Box"));

var _locale = _interopRequireDefault(require("../assets/locale"));

const _excluded = ["locale"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * GetWallet
 */
function GetWallet(_ref) {
  let {
    locale
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  const linkRef = _react.default.useRef();

  return /*#__PURE__*/_react.default.createElement(Root, Object.assign({}, rest, {
    onClick: () => linkRef.current.click()
  }), /*#__PURE__*/_react.default.createElement(_Box.default, {
    component: "span",
    ml: 1,
    fontWeight: 700,
    fontSize: 14,
    color: "#9397A1",
    dangerouslySetInnerHTML: {
      __html: _locale.default[locale].getWallet
    }
  }), /*#__PURE__*/_react.default.createElement("a", {
    href: "https://www.didwallet.io/".concat(locale === 'zh' ? 'zh' : 'en'),
    target: "_blank",
    ref: linkRef,
    style: {
      display: 'none'
    },
    rel: "noreferrer"
  }, "link"));
}

GetWallet.propTypes = {
  locale: _propTypes.default.oneOf(['en', 'zh'])
};
GetWallet.defaultProps = {
  locale: 'en'
};
const Root = (0, _styledComponents.default)(_Box.default).withConfig({
  displayName: "get-wallet__Root",
  componentId: "sc-1dwn8ft-0"
})(["display:flex;align-items:center;justify-content:center;cursor:pointer;"]);