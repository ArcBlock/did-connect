"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _react = _interopRequireWildcard(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _material = require("@mui/material");

var _styles = require("@mui/styles");

var _AccountOutline = _interopRequireDefault(require("mdi-material-ui/AccountOutline"));

var _ShieldCheck = _interopRequireDefault(require("mdi-material-ui/ShieldCheck"));

var _OpenIn = _interopRequireDefault(require("@arcblock/icons/lib/OpenIn"));

var _Disconnect = _interopRequireDefault(require("@arcblock/icons/lib/Disconnect"));

var _Switch = _interopRequireDefault(require("@arcblock/icons/lib/Switch"));

var _PersonOutline = _interopRequireDefault(require("@mui/icons-material/PersonOutline"));

var _VpnKeyOutlined = _interopRequireDefault(require("@mui/icons-material/VpnKeyOutlined"));

var _useBrowser = _interopRequireDefault(require("@arcblock/react-hooks/lib/useBrowser"));

var _Avatar = _interopRequireDefault(require("../Avatar"));

var _Address = _interopRequireDefault(require("../Address"));

const _excluded = ["session", "locale", "showText", "showRole", "switchDid", "switchProfile", "switchPassport", "disableLogout", "onLogin", "onLogout", "onSwitchDid", "onSwitchProfile", "onSwitchPassport", "menu", "menuRender", "dark", "size"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const messages = {
  zh: {
    switchDid: '切换账户',
    switchProfile: '切换用户信息',
    switchPassport: '切换通行证',
    disconnect: '退出',
    connect: '登录',
    openInWallet: '打开 DID 钱包'
  },
  en: {
    switchDid: 'Switch DID',
    switchProfile: 'Switch Profile',
    switchPassport: 'Switch Passport',
    disconnect: 'Disconnect',
    connect: 'Connect',
    openInWallet: 'Open DID Wallet'
  }
};
const useStyles = (0, _styles.makeStyles)(theme => ({
  root: {},
  user: {
    fontSize: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '24px 24px 10px'
  },
  userName: {
    fontSize: 20,
    color: _ref => {
      let {
        dark
      } = _ref;
      return dark ? '#aaa' : '#222';
    },
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  menuList: {
    padding: 0
  },
  menuItem: {
    padding: '18.5px 24px',
    color: '#777',
    fontSize: 16,
    '&:hover': {
      backgroundColor: '#fbfbfb'
    }
  },
  menuIcon: {
    color: '#999',
    marginRight: 16
  },
  popper: {
    zIndex: theme.zIndex.tooltip
  },
  paper: {
    borderColor: '#F0F0F0',
    boxShadow: '0px 8px 12px rgba(92, 92, 92, 0.04)',
    borderRadius: theme.spacing(2),
    overflow: 'hidden',
    maxWidth: 'calc(100vw - 10px)',
    '& .MuiChip-root .MuiChip-icon': {
      color: theme.palette.success.main
    }
  },
  darkPaper: {
    backgroundColor: '#27282c',
    color: '#fff',
    border: 0,
    '& .MuiChip-root': {
      borderColor: '#aaa'
    },
    '& .MuiListItem-root, & .MuiChip-label': {
      color: '#aaa'
    },
    '& .MuiListItem-root:hover': {
      backgroundColor: '#363434'
    }
  },
  role: {
    height: 'auto',
    marginRight: 0
  },
  loginButton: {
    borderRadius: '100vw'
  },
  darkLoginButton: {
    color: '#fff',
    borderColor: '#fff'
  }
}));

const SessionManager = _ref2 => {
  var _session$user, _session$user$avatar, _session$user3, _session$user4;

  let {
    session,
    locale,
    showText,
    showRole,
    switchDid,
    switchProfile,
    switchPassport,
    disableLogout,
    onLogin,
    onLogout,
    onSwitchDid,
    onSwitchProfile,
    onSwitchPassport,
    menu,
    menuRender,
    dark,
    size
  } = _ref2,
      rest = _objectWithoutProperties(_ref2, _excluded);

  const userAnchorRef = (0, _react.useRef)(null);
  const classes = useStyles({
    dark
  });
  const [userOpen, setUserOpen] = (0, _react.useState)(false); // base64 img maybe have some blank char, need encodeURIComponent to transform it

  const avatar = (_session$user = session.user) === null || _session$user === void 0 ? void 0 : (_session$user$avatar = _session$user.avatar) === null || _session$user$avatar === void 0 ? void 0 : _session$user$avatar.replace(/\s/g, encodeURIComponent(' '));
  const currentRole = (0, _react.useMemo)(() => {
    var _session$user2, _session$user2$passpo;

    return (_session$user2 = session.user) === null || _session$user2 === void 0 ? void 0 : (_session$user2$passpo = _session$user2.passports) === null || _session$user2$passpo === void 0 ? void 0 : _session$user2$passpo.find(item => item.name === session.user.role);
  }, [session.user]);
  const browser = (0, _useBrowser.default)();

  if (!session.user) {
    return showText ? /*#__PURE__*/_react.default.createElement(_material.Button, Object.assign({
      className: "".concat(classes.loginButton, " ").concat(dark && classes.darkLoginButton),
      variant: "outlined",
      onClick: _onLogin
    }, rest, {
      "data-cy": "sessionManager-login"
    }), /*#__PURE__*/_react.default.createElement(_material.SvgIcon, {
      component: _AccountOutline.default
    }), /*#__PURE__*/_react.default.createElement("span", {
      style: {
        lineHeight: '25px'
      }
    }, messages[locale].connect)) : /*#__PURE__*/_react.default.createElement(_material.IconButton, Object.assign({}, rest, {
      onClick: _onLogin,
      "data-cy": "sessionManager-login",
      size: "large"
    }), /*#__PURE__*/_react.default.createElement(_material.SvgIcon, {
      component: _AccountOutline.default,
      style: {
        fontSize: size * 1.14286,
        color: dark ? '#fff' : ''
      }
    }));
  }

  function onToggleUser() {
    setUserOpen(prevOpen => !prevOpen);
  }

  function onCloseUser(e) {
    if (userAnchorRef.current && userAnchorRef.current.contains(e.target)) {
      return;
    }

    setUserOpen(false);
  }

  function _onLogin() {
    session.login(onLogin);
  }

  function _onLogout() {
    session.logout(function () {
      setUserOpen(false);
      onLogout(...arguments);
    });
  }

  function _onSwitchDid() {
    session.switchDid(function () {
      setUserOpen(false);
      onSwitchDid(...arguments);
    });
  }

  function _onSwitchProfile() {
    session.switchProfile(function () {
      setUserOpen(false);
      onSwitchProfile(...arguments);
    });
  }

  function _onSwitchPassport() {
    setUserOpen(false);
    session.switchPassport(function () {
      setUserOpen(false);
      onSwitchPassport(...arguments);
    });
  }

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement(_material.IconButton, Object.assign({
    ref: userAnchorRef,
    onClick: onToggleUser,
    className: classes.root
  }, rest, {
    "data-cy": "sessionManager-logout-popup",
    size: "large"
  }), /*#__PURE__*/_react.default.createElement(_Avatar.default, {
    variant: "circle",
    did: session.user.did,
    src: avatar,
    size: size,
    shape: "circle"
  })), userAnchorRef.current && /*#__PURE__*/_react.default.createElement(_material.Popper, {
    className: classes.popper,
    open: userOpen,
    disablePortal: true,
    anchorEl: userAnchorRef.current,
    placement: "bottom-end"
  }, /*#__PURE__*/_react.default.createElement(_material.Paper, {
    className: "".concat(classes.paper, " ").concat(dark && classes.darkPaper),
    variant: "outlined"
  }, /*#__PURE__*/_react.default.createElement(_material.ClickAwayListener, {
    onClickAway: onCloseUser
  }, /*#__PURE__*/_react.default.createElement(_material.MenuList, {
    className: classes.menuList
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: classes.user
  }, /*#__PURE__*/_react.default.createElement("div", {
    className: classes.userName
  }, /*#__PURE__*/_react.default.createElement("span", null, session.user.fullName), !!showRole && ((currentRole === null || currentRole === void 0 ? void 0 : currentRole.title) || ((_session$user3 = session.user) === null || _session$user3 === void 0 ? void 0 : _session$user3.role.toUpperCase())) && /*#__PURE__*/_react.default.createElement(_material.Chip, {
    label: (currentRole === null || currentRole === void 0 ? void 0 : currentRole.title) || ((_session$user4 = session.user) === null || _session$user4 === void 0 ? void 0 : _session$user4.role.toUpperCase()),
    size: "small",
    variant: "outlined",
    className: classes.role,
    icon: /*#__PURE__*/_react.default.createElement(_material.SvgIcon, {
      component: _ShieldCheck.default,
      size: "small"
    })
  })), /*#__PURE__*/_react.default.createElement(_Address.default, {
    responsive: false
  }, session.user.did)), Array.isArray(menu) && menu.map((menuItem, index) => {
    return /*#__PURE__*/_react.default.createElement(_material.MenuItem, Object.assign({
      key: index,
      className: classes.menuItem
    }, _objectSpread(_objectSpread({}, menuItem), {}, {
      icon: undefined,
      label: undefined
    })), menuItem.svgIcon ? menuItem.svgIcon && /*#__PURE__*/_react.default.createElement(_material.SvgIcon, {
      component: menuItem.svgIcon,
      className: classes.menuIcon
    }) : menuItem.icon, menuItem.label);
  }), menuRender({
    classes: {
      menuItem: classes.menuItem,
      menuIcon: classes.menuIcon
    }
  }), !browser.wallet && /*#__PURE__*/_react.default.createElement(_material.MenuItem, {
    component: "a",
    className: classes.menuItem,
    "data-cy": "sessionManager-openInWallet",
    href: "https://www.abtwallet.io/",
    target: "_blank"
  }, /*#__PURE__*/_react.default.createElement(_material.SvgIcon, {
    component: _OpenIn.default,
    className: classes.menuIcon
  }), messages[locale].openInWallet), !!switchDid && /*#__PURE__*/_react.default.createElement(_material.MenuItem, {
    className: classes.menuItem,
    onClick: _onSwitchDid,
    "data-cy": "sessionManager-switch-trigger"
  }, /*#__PURE__*/_react.default.createElement(_material.SvgIcon, {
    component: _Switch.default,
    className: classes.menuIcon
  }), messages[locale].switchDid), !!switchProfile && /*#__PURE__*/_react.default.createElement(_material.MenuItem, {
    className: classes.menuItem,
    onClick: _onSwitchProfile,
    "data-cy": "sessionManager-switch-profile-trigger"
  }, /*#__PURE__*/_react.default.createElement(_material.SvgIcon, {
    component: _PersonOutline.default,
    className: classes.menuIcon
  }), messages[locale].switchProfile), !!switchPassport && /*#__PURE__*/_react.default.createElement(_material.MenuItem, {
    className: classes.menuItem,
    onClick: _onSwitchPassport,
    "data-cy": "sessionManager-switch-passport-trigger"
  }, /*#__PURE__*/_react.default.createElement(_material.SvgIcon, {
    component: _VpnKeyOutlined.default,
    className: classes.menuIcon
  }), messages[locale].switchPassport), /*#__PURE__*/_react.default.createElement(_material.MenuItem, {
    className: classes.menuItem,
    onClick: _onLogout,
    disabled: disableLogout,
    "data-cy": "sessionManager-logout-trigger"
  }, /*#__PURE__*/_react.default.createElement(_material.SvgIcon, {
    component: _Disconnect.default,
    className: classes.menuIcon
  }), messages[locale].disconnect))))));
};

SessionManager.propTypes = {
  session: _propTypes.default.shape({
    user: _propTypes.default.shape({
      did: _propTypes.default.string.isRequired,
      role: _propTypes.default.string.isRequired,
      fullName: _propTypes.default.string,
      avatar: _propTypes.default.string,
      passports: _propTypes.default.arrayOf(_propTypes.default.shape({
        name: _propTypes.default.string.isRequired,
        title: _propTypes.default.string.isRequired
      }))
    }),
    login: _propTypes.default.func.isRequired,
    logout: _propTypes.default.func.isRequired,
    switchDid: _propTypes.default.func.isRequired,
    switchProfile: _propTypes.default.func.isRequired,
    switchPassport: _propTypes.default.func.isRequired
  }).isRequired,
  locale: _propTypes.default.string,
  showText: _propTypes.default.bool,
  showRole: _propTypes.default.bool,
  switchDid: _propTypes.default.bool,
  switchProfile: _propTypes.default.bool,
  switchPassport: _propTypes.default.bool,
  disableLogout: _propTypes.default.bool,
  onLogin: _propTypes.default.func,
  onLogout: _propTypes.default.func,
  onSwitchDid: _propTypes.default.func,
  onSwitchProfile: _propTypes.default.func,
  onSwitchPassport: _propTypes.default.func,
  menu: _propTypes.default.array,
  menuRender: _propTypes.default.func,
  dark: _propTypes.default.bool,
  size: _propTypes.default.number
};

const noop = () => {};

SessionManager.defaultProps = {
  locale: 'en',
  showText: false,
  showRole: false,
  switchDid: true,
  switchProfile: true,
  switchPassport: true,
  disableLogout: false,
  menu: [],
  menuRender: noop,
  onLogin: noop,
  onLogout: noop,
  onSwitchDid: noop,
  onSwitchProfile: noop,
  onSwitchPassport: noop,
  dark: false,
  size: 28
};
var _default = SessionManager;
exports.default = _default;