import React from 'react';
import PropTypes from 'prop-types';
import omit from 'lodash/omit';
import Cookie from 'js-cookie';

import { getCookieOptions } from '@arcblock/ux/lib/Util';
import Center from '@arcblock/ux/lib/Center';
import Spinner from '@arcblock/ux/lib/Spinner';

import Connect from '../Connect';
import createService from '../Service';
import createStorage from '../Storage';
import { getAppId, updateConnectedInfo } from '../utils';

export const SessionContext = React.createContext();
const { Provider, Consumer } = SessionContext;

const AUTH_SERVICE_PREFIX = '/.well-known/service';

const translations = {
  login: {
    en: {
      title: 'Connect DID Wallet',
      scan: 'Scan following qrcode to connect your DID Wallet',
      confirm: 'Confirm connection in your DID Wallet',
      success: 'Successfully connected',
    },
    zh: {
      title: '连接 DID 钱包',
      scan: '请使用 DID 钱包扫码下面的二维码完成连接',
      confirm: '在 DID 钱包中确认连接',
      success: '连接成功',
    },
  },
  'switch-profile': {
    en: {
      title: 'Connect DID Wallet',
      scan: 'Scan following qrcode with DID Wallet to switch profile',
      confirm: 'Select profile in your DID Wallet',
      success: 'Profile updated',
    },
    zh: {
      title: '连接 DID 钱包',
      scan: '请使用 DID 钱包扫码下面的二维码以切换个人档案',
      confirm: '在 DID 钱包中选择个人档案',
      success: '个人档案已经更新',
    },
  },
  'switch-passport': {
    en: {
      title: 'Connect DID Wallet',
      scan: 'Scan following qrcode with DID Wallet to switch passport',
      confirm: 'Select passport in your DID Wallet',
      success: 'Passport and session updated',
    },
    zh: {
      title: '连接 DID 钱包',
      scan: '请使用 DID 钱包扫码下面的二维码以切换通行证',
      confirm: '在 DID 钱包中选择通行证',
      success: '通行证和会话已经更新',
    },
  },
};

export default function createSessionContext(
  storageKey = 'login_token',
  storageEngine = 'ls',
  storageOptions = {},
  appendAuthServicePrefix = false
) {
  const storage = createStorage(storageKey, storageEngine, storageOptions);
  const { getToken, setToken, removeToken } = storage;

  const clearSession = () => {
    const cookieOptions = getCookieOptions({ returnDomain: false });
    Cookie.remove('connected_did', cookieOptions);
    Cookie.remove('connected_pk', cookieOptions);
    Cookie.remove('connected_app', cookieOptions);
    Cookie.remove('connected_wallet_os', cookieOptions);
    removeToken();
  };

  class SessionProvider extends React.Component {
    constructor(props) {
      super(props);

      this.service = createService(props.serviceHost, storage);
      this.state = {
        action: props.action,
        error: '',
        initialized: false,
        loading: false,
        open: false,
        user: null,
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
      this.listeners = { login: [], 'switch-profile': [], 'switch-passport': [] };
    }

    get fullPrefix() {
      if (appendAuthServicePrefix || this.props.appendAuthServicePrefix) {
        return `${AUTH_SERVICE_PREFIX}${this.props.prefix}`;
      }
      return this.props.prefix;
    }

    // 不可以直接个性 props.autoConnect (readonly)
    get autoConnect() {
      // for backward compatibility
      if (typeof this.props.autoConnect === 'boolean') {
        return this.props.autoConnect;
      }
      // eslint-disable-next-line react/prop-types
      return !!this.props.autoLogin;
    }

    componentDidMount() {
      const { autoDisconnect } = this.props;
      // ensure we are in the same app
      const connectedApp = Cookie.get('connected_app');
      const actualApp = getAppId();
      if (autoDisconnect && connectedApp && actualApp && connectedApp !== actualApp) {
        clearSession();
        this.setState({ initialized: true, open: this.autoConnect });
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

      this.setState({ initialized: true, open: this.autoConnect });
    }

    async refresh(showProgress = false, setInitialized = false) {
      try {
        if (this.state.loading) {
          console.warn('SessionProvider.refresh is currently in progress, call it will be noop');
          return;
        }

        if (showProgress) {
          this.setState({ loading: true });
        }

        const { autoConnect } = this;
        const prefix = this.fullPrefix;

        const { data, status } = await this.service.get(`${prefix}/session`.replace(/\/+/, '/'));

        if (status === 400) {
          removeToken();
          if (showProgress) {
            this.setState({ user: null, error: '', loading: false });
          } else {
            this.setState({ user: null, error: '' });
          }
        }

        if (data.error) {
          // Some thing went wrong
          if (showProgress) {
            this.setState({ error: data.error, open: false, loading: false });
          } else {
            this.setState({ error: data.error, open: false });
          }
        } else if (data.user) {
          // We have valid user
          if (showProgress) {
            this.setState({ open: false, loading: false, ...data });
          } else {
            this.setState({ open: false, ...data });
          }
        } else {
          // We may have an invalid token
          removeToken();
          if (showProgress) {
            this.setState({ open: autoConnect, user: null, loading: autoConnect, ...data });
          } else {
            this.setState({ open: autoConnect, user: null, ...data });
          }
        }
      } catch (err) {
        console.error('SessionProvider.refresh error', err);
        if (showProgress) {
          this.setState({ error: err.message, loading: false, open: false });
        } else {
          this.setState({ error: err.message, open: false });
        }
      } finally {
        if (setInitialized) {
          this.setState({ initialized: true });
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
      this.setState({ open: true, action: 'login' });
    }

    logout(done) {
      // 避免 disconnect 后自动连接
      const cookieOptions = getCookieOptions({ returnDomain: false });
      Cookie.remove('connected_wallet_os', cookieOptions);
      Cookie.remove('connected_app', cookieOptions);
      removeToken();
      this.setState({ user: null, error: '', open: false, loading: false }, done);
    }

    switchDid(done) {
      clearSession();
      this.setState({ user: null, error: '', open: false, loading: false }, done);
    }

    switchProfile(done) {
      if (!this.state.user) {
        return;
      }
      if (typeof done === 'function') {
        this.listeners['switch-profile'].push(done);
      }
      this.setState({ open: true, action: 'switch-profile' });
    }

    switchPassport(done) {
      if (!this.state.user) {
        return;
      }
      if (typeof done === 'function') {
        this.listeners['switch-passport'].push(done);
      }
      this.setState({ open: true, action: 'switch-passport' });
    }

    onLogin(result, decrypt) {
      const { loginToken, sessionToken } = result;
      const token = loginToken || sessionToken;
      if (token) {
        setToken(decrypt(token));
        this.setState({ loading: false }, async () => {
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
      this.setState({ loading: false }, async () => {
        await this.refresh(true);
      });
    }

    onClose(action) {
      this.setState({ open: false });
      this.listeners[action] = [];
    }

    render() {
      const { children, locale, timeout, extraParams, webWalletUrl, messages, ...rest } =
        this.props;
      const { autoConnect } = this;
      const { action, user, open, initialized, loading } = this.state;

      const prefix = this.fullPrefix;

      const state = {
        api: this.service,
        session: {
          ...this.state,
          loading: autoConnect ? !user || loading : loading,
          login: this.login,
          logout: this.logout,
          switchDid: this.switchDid,
          switchProfile: this.switchProfile,
          switchPassport: this.switchPassport,
          refresh: this.refresh,
          updateConnectedInfo,
        },
      };

      if (!initialized) {
        return (
          <Center>
            <Spinner />
          </Center>
        );
      }

      const connectMessages = messages || translations[action];
      const callbacks = {
        login: this.onLogin,
        'switch-profile': this.onSwitchProfile,
        'switch-passport': this.onLogin,
      };

      return (
        <Provider value={state}>
          {!open && typeof children === 'function' ? children(state) : children}
          <Connect
            action={action}
            locale={locale}
            checkFn={this.service.get}
            onClose={() => this.onClose(action)}
            onSuccess={callbacks[action]}
            extraParams={extraParams}
            checkTimeout={timeout}
            webWalletUrl={webWalletUrl}
            messages={connectMessages[locale]}
            popup
            open={open}
            // {...rest} 允许在使用 SessionProvider 时将一些额外的 props 传递到内部的 Connect 组件, 比如 dialogStyle
            {...omit(rest, ['action'])}
            // 注意 prefix 经过了特殊处理, 优先级高于 "...rest", 所以放在其后
            prefix={prefix}
          />
        </Provider>
      );
    }
  }

  SessionProvider.propTypes = {
    children: PropTypes.any.isRequired,
    serviceHost: PropTypes.string.isRequired,
    action: PropTypes.string,
    prefix: PropTypes.string,
    appendAuthServicePrefix: PropTypes.bool,
    locale: PropTypes.string,
    timeout: PropTypes.number,
    autoConnect: PropTypes.bool, // should we open connect dialog when session not found
    autoDisconnect: PropTypes.bool, // should we auto disconnect on appId mismatch
    extraParams: PropTypes.object,
    webWalletUrl: PropTypes.string,
    messages: PropTypes.object,
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
    messages: null,
  };

  function withSession(Component) {
    return function WithSessionComponent(props) {
      return <Consumer>{sessionProps => <Component {...props} {...sessionProps} />}</Consumer>;
    };
  }

  return { SessionProvider, SessionConsumer: Consumer, SessionContext, withSession };
}

export function createAuthServiceSessionContext({ storageEngine = 'cookie' } = {}) {
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

    return createSessionContext(
      storageKey,
      'cookie',
      {
        path,
        returnDomain: false,
      },
      true
    );
  }

  if (storageEngine === 'localStorage') {
    return createSessionContext(storageKey, 'ls', {}, true);
  }

  throw new Error('storageEngine must be cookie or localStorage');
}
