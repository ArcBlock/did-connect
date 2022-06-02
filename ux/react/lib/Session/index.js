"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SessionContext = void 0;
exports.createAuthServiceSessionContext = createAuthServiceSessionContext;
exports.default = createSessionContext;

var _react = _interopRequireDefault(require("react"));

var _propTypes = _interopRequireDefault(require("prop-types"));

var _omit = _interopRequireDefault(require("lodash/omit"));

var _jsCookie = _interopRequireDefault(require("js-cookie"));

var _Util = require("@arcblock/ux/lib/Util");

var _Center = _interopRequireDefault(require("@arcblock/ux/lib/Center"));

var _Spinner = _interopRequireDefault(require("@arcblock/ux/lib/Spinner"));

var _Connect = _interopRequireDefault(require("../Connect"));

var _Service = _interopRequireDefault(require("../Service"));

var _Storage = _interopRequireDefault(require("../Storage"));

var _utils = require("../utils");

const _excluded = ["children", "locale", "timeout", "extraParams", "webWalletUrl", "messages"];

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const SessionContext = /*#__PURE__*/_react.default.createContext();

exports.SessionContext = SessionContext;
const {
  Provider,
  Consumer
} = SessionContext;
const AUTH_SERVICE_PREFIX = '/.well-known/service';
const translations = {
  login: {
    en: {
      title: 'Connect DID Wallet',
      scan: 'Scan following qrcode to connect your DID Wallet',
      confirm: 'Confirm connection in your DID Wallet',
      success: 'Successfully connected'
    },
    zh: {
      title: '连接 DID 钱包',
      scan: '请使用 DID 钱包扫码下面的二维码完成连接',
      confirm: '在 DID 钱包中确认连接',
      success: '连接成功'
    }
  },
  'switch-profile': {
    en: {
      title: 'Connect DID Wallet',
      scan: 'Scan following qrcode with DID Wallet to switch profile',
      confirm: 'Select profile in your DID Wallet',
      success: 'Profile updated'
    },
    zh: {
      title: '连接 DID 钱包',
      scan: '请使用 DID 钱包扫码下面的二维码以切换个人档案',
      confirm: '在 DID 钱包中选择个人档案',
      success: '个人档案已经更新'
    }
  },
  'switch-passport': {
    en: {
      title: 'Connect DID Wallet',
      scan: 'Scan following qrcode with DID Wallet to switch passport',
      confirm: 'Select passport in your DID Wallet',
      success: 'Passport and session updated'
    },
    zh: {
      title: '连接 DID 钱包',
      scan: '请使用 DID 钱包扫码下面的二维码以切换通行证',
      confirm: '在 DID 钱包中选择通行证',
      success: '通行证和会话已经更新'
    }
  }
};

function createSessionContext() {
  let storageKey = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'login_token';
  let storageEngine = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'ls';
  let storageOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  let appendAuthServicePrefix = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
  const storage = (0, _Storage.default)(storageKey, storageEngine, storageOptions);
  const {
    getToken,
    setToken,
    removeToken
  } = storage;

  const clearSession = () => {
    const cookieOptions = (0, _Util.getCookieOptions)({
      returnDomain: false
    });

    _jsCookie.default.remove('connected_did', cookieOptions);

    _jsCookie.default.remove('connected_pk', cookieOptions);

    _jsCookie.default.remove('connected_app', cookieOptions);

    _jsCookie.default.remove('connected_wallet_os', cookieOptions);

    removeToken();
  };

  class SessionProvider extends _react.default.Component {
    constructor(props) {
      super(props);
      this.service = (0, _Service.default)(props.serviceHost, storage);
      this.state = {
        action: props.action,
        error: '',
        initialized: false,
        loading: false,
        open: false,
        user: null
      };
      this.onLogin = this.onLogin.bind(this);
      this.onClose = this.onClose.bind(this);
      this.onSwitchProfile = this.onSwitchProfile.bind(this);
      this.login = this.login.bind(this);
      this.logout = this.logout.bind(this);
      this.switchDid = this.switchDid.bind(this);
      this.switchProfile = this.switchProfile.bind(this);
      this.switchPassport = this.switchPassport.bind(this);
      this.refresh = this.refresh.bind(this);
      this.listeners = {
        login: [],
        'switch-profile': [],
        'switch-passport': []
      };
    }

    get fullPrefix() {
      if (appendAuthServicePrefix || this.props.appendAuthServicePrefix) {
        return "".concat(AUTH_SERVICE_PREFIX).concat(this.props.prefix);
      }

      return this.props.prefix;
    } // 不可以直接个性 props.autoConnect (readonly)


    get autoConnect() {
      // for backward compatibility
      if (typeof this.props.autoConnect === 'boolean') {
        return this.props.autoConnect;
      } // eslint-disable-next-line react/prop-types


      return !!this.props.autoLogin;
    }

    componentDidMount() {
      const {
        autoDisconnect
      } = this.props; // ensure we are in the same app

      const connectedApp = _jsCookie.default.get('connected_app');

      const actualApp = (0, _utils.getAppId)();

      if (autoDisconnect && connectedApp && actualApp && connectedApp !== actualApp) {
        clearSession();
        this.setState({
          initialized: true,
          open: this.autoConnect
        });
        return;
      }

      const token = getToken();

      if (token) {
        this.refresh(true, true);
        return;
      }

      if (typeof window !== 'undefined') {
        // If a login token exist in url, set that token in storage
        const url = new URL(window.location.href);
        const loginToken = url.searchParams.get('loginToken');

        if (loginToken) {
          setToken(loginToken);
          this.refresh(true, true);
          url.searchParams.delete('loginToken');
          window.history.replaceState({}, window.title, url.href);
          return;
        }
      }

      this.setState({
        initialized: true,
        open: this.autoConnect
      });
    }

    async refresh() {
      let showProgress = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      let setInitialized = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      try {
        if (this.state.loading) {
          console.warn('SessionProvider.refresh is currently in progress, call it will be noop');
          return;
        }

        if (showProgress) {
          this.setState({
            loading: true
          });
        }

        const {
          autoConnect
        } = this;
        const prefix = this.fullPrefix;
        const {
          data,
          status
        } = await this.service.get("".concat(prefix, "/session").replace(/\/+/, '/'));

        if (status === 400) {
          removeToken();

          if (showProgress) {
            this.setState({
              user: null,
              error: '',
              loading: false
            });
          } else {
            this.setState({
              user: null,
              error: ''
            });
          }
        }

        if (data.error) {
          // Some thing went wrong
          if (showProgress) {
            this.setState({
              error: data.error,
              open: false,
              loading: false
            });
          } else {
            this.setState({
              error: data.error,
              open: false
            });
          }
        } else if (data.user) {
          // We have valid user
          if (showProgress) {
            this.setState(_objectSpread({
              open: false,
              loading: false
            }, data));
          } else {
            this.setState(_objectSpread({
              open: false
            }, data));
          }
        } else {
          // We may have an invalid token
          removeToken();

          if (showProgress) {
            this.setState(_objectSpread({
              open: autoConnect,
              user: null,
              loading: autoConnect
            }, data));
          } else {
            this.setState(_objectSpread({
              open: autoConnect,
              user: null
            }, data));
          }
        }
      } catch (err) {
        console.error('SessionProvider.refresh error', err);

        if (showProgress) {
          this.setState({
            error: err.message,
            loading: false,
            open: false
          });
        } else {
          this.setState({
            error: err.message,
            open: false
          });
        }
      } finally {
        if (setInitialized) {
          this.setState({
            initialized: true
          });
        }
      }
    }

    login(done) {
      if (this.state.user) {
        return;
      }

      if (typeof done === 'function') {
        this.listeners.login.push(done);
      }

      this.setState({
        open: true,
        action: 'login'
      });
    }

    logout(done) {
      // 避免 disconnect 后自动连接
      const cookieOptions = (0, _Util.getCookieOptions)({
        returnDomain: false
      });

      _jsCookie.default.remove('connected_wallet_os', cookieOptions);

      _jsCookie.default.remove('connected_app', cookieOptions);

      removeToken();
      this.setState({
        user: null,
        error: '',
        open: false,
        loading: false
      }, done);
    }

    switchDid(done) {
      clearSession();
      this.setState({
        user: null,
        error: '',
        open: false,
        loading: false
      }, done);
    }

    switchProfile(done) {
      if (!this.state.user) {
        return;
      }

      if (typeof done === 'function') {
        this.listeners['switch-profile'].push(done);
      }

      this.setState({
        open: true,
        action: 'switch-profile'
      });
    }

    switchPassport(done) {
      if (!this.state.user) {
        return;
      }

      if (typeof done === 'function') {
        this.listeners['switch-passport'].push(done);
      }

      this.setState({
        open: true,
        action: 'switch-passport'
      });
    }

    onLogin(result, decrypt) {
      const {
        loginToken,
        sessionToken
      } = result;
      const token = loginToken || sessionToken;

      if (token) {
        setToken(decrypt(token));
        this.setState({
          loading: false
        }, async () => {
          await this.refresh(true);

          while (this.listeners.login.length) {
            const cb = this.listeners.login.shift();

            try {
              cb(result, decrypt);
            } catch (err) {
              console.error('Error when call login listeners', err);
            }
          }
        });
      }
    }

    onSwitchProfile() {
      this.setState({
        loading: false
      }, async () => {
        await this.refresh(true);
      });
    }

    onClose(action) {
      this.setState({
        open: false
      });
      this.listeners[action] = [];
    }

    render() {
      const _this$props = this.props,
            {
        children,
        locale,
        timeout,
        extraParams,
        webWalletUrl,
        messages
      } = _this$props,
            rest = _objectWithoutProperties(_this$props, _excluded);

      const {
        autoConnect
      } = this;
      const {
        action,
        user,
        open,
        initialized,
        loading
      } = this.state;
      const prefix = this.fullPrefix;
      const state = {
        api: this.service,
        session: _objectSpread(_objectSpread({}, this.state), {}, {
          loading: autoConnect ? !user || loading : loading,
          login: this.login,
          logout: this.logout,
          switchDid: this.switchDid,
          switchProfile: this.switchProfile,
          switchPassport: this.switchPassport,
          refresh: this.refresh,
          updateConnectedInfo: _utils.updateConnectedInfo
        })
      };

      if (!initialized) {
        return /*#__PURE__*/_react.default.createElement(_Center.default, null, /*#__PURE__*/_react.default.createElement(_Spinner.default, null));
      }

      const connectMessages = messages || translations[action];
      const callbacks = {
        login: this.onLogin,
        'switch-profile': this.onSwitchProfile,
        'switch-passport': this.onLogin
      };
      return /*#__PURE__*/_react.default.createElement(Provider, {
        value: state
      }, !open && typeof children === 'function' ? children(state) : children, /*#__PURE__*/_react.default.createElement(_Connect.default, Object.assign({
        action: action,
        locale: locale,
        checkFn: this.service.get,
        onClose: () => this.onClose(action),
        onSuccess: callbacks[action],
        extraParams: extraParams,
        checkTimeout: timeout,
        webWalletUrl: webWalletUrl,
        messages: connectMessages[locale],
        popup: true,
        open: open // {...rest} 允许在使用 SessionProvider 时将一些额外的 props 传递到内部的 Connect 组件, 比如 dialogStyle

      }, (0, _omit.default)(rest, ['action']), {
        // 注意 prefix 经过了特殊处理, 优先级高于 "...rest", 所以放在其后
        prefix: prefix
      })));
    }

  }

  SessionProvider.propTypes = {
    children: _propTypes.default.any.isRequired,
    serviceHost: _propTypes.default.string.isRequired,
    action: _propTypes.default.string,
    prefix: _propTypes.default.string,
    appendAuthServicePrefix: _propTypes.default.bool,
    locale: _propTypes.default.string,
    timeout: _propTypes.default.number,
    autoConnect: _propTypes.default.bool,
    // should we open connect dialog when session not found
    autoDisconnect: _propTypes.default.bool,
    // should we auto disconnect on appId mismatch
    extraParams: _propTypes.default.object,
    webWalletUrl: _propTypes.default.string,
    messages: _propTypes.default.object
  };
  SessionProvider.defaultProps = {
    locale: 'en',
    action: 'login',
    prefix: '/api/did',
    appendAuthServicePrefix: false,
    extraParams: {},
    autoConnect: null,
    autoDisconnect: true,
    timeout: 5 * 60 * 1000,
    webWalletUrl: '',
    messages: null
  };

  function withSession(Component) {
    return function WithSessionComponent(props) {
      return /*#__PURE__*/_react.default.createElement(Consumer, null, sessionProps => /*#__PURE__*/_react.default.createElement(Component, Object.assign({}, props, sessionProps)));
    };
  }

  return {
    SessionProvider,
    SessionConsumer: Consumer,
    SessionContext,
    withSession
  };
}

function createAuthServiceSessionContext() {
  let {
    storageEngine = 'cookie'
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const storageKey = 'login_token';

  if (storageEngine === 'cookie') {
    let path = '/';

    if (typeof window !== 'undefined') {
      const env = window.env || {};
      const blocklet = window.blocklet || {};
      path = env.groupPathPrefix || blocklet.groupPrefix || blocklet.prefix || '';
      path = path.replace(/\/+$/, '');
      path = path || '/';
    }

    return createSessionContext(storageKey, 'cookie', {
      path,
      returnDomain: false
    }, true);
  }

  if (storageEngine === 'localStorage') {
    return createSessionContext(storageKey, 'ls', {}, true);
  }

  throw new Error('storageEngine must be cookie or localStorage');
}