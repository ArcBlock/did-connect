import { TAnyObject, TSession, TLocaleCode, TI18nMessages } from '@did-connect/types';
import { createContext, Component } from 'react';
import { AxiosInstance } from 'axios';
import omit from 'lodash/omit';
import Cookie from 'js-cookie';

import { getCookieOptions } from '@arcblock/ux/lib/Util';
import Center from '@arcblock/ux/lib/Center';
import Spinner from '@arcblock/ux/lib/Spinner';

import Connect from '../Connect';
import createService from '../Service';
import createStorage from '../Storage';
import { getAppId, updateConnectedInfo } from '../utils';

import { EngineType, StorageEngine } from '../Storage/types';

type I18nGroup = { [key: string]: TI18nMessages };

const translations: I18nGroup = {
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

const defaultProps = {
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

type ProviderProps = {
  children: React.ReactNode;
  serviceHost: string;
  action?: string;
  prefix?: string;
  appendAuthServicePrefix?: boolean;
  locale?: TLocaleCode;
  timeout?: number;
  autoConnect?: boolean;
  autoDisconnect?: boolean;
  extraParams?: TAnyObject;
  webWalletUrl?: string;
  messages?: I18nGroup | null;
} & typeof defaultProps;

type ProviderState = {
  action: string;
  error: string;
  initialized: boolean;
  loading: boolean;
  open: boolean;
  user: any; // FIXME: user type
};

type ContextState = {
  api: AxiosInstance;
  session: ProviderState & {
    login(done: any): void;
    logout(done: any): void;
    switchDid(done: any): void;
    switchProfile(done: any): void;
    switchPassport(done: any): void;
    refresh(): void;
    updateConnectedInfo(ctx: TSession): void;
  };
};

export const SessionContext = createContext<ContextState>({} as ContextState);

const { Provider, Consumer } = SessionContext;

const AUTH_SERVICE_PREFIX = '/.well-known/service';

export default function createSessionContext(
  storageKey: string = 'login_token',
  storageEngine: EngineType = 'ls',
  storageOptions: TAnyObject = {},
  appendAuthServicePrefix = false
): any {
  const storage: StorageEngine = createStorage(storageKey, storageEngine, storageOptions);
  const { getToken, setToken, removeToken } = storage;

  const clearSession = () => {
    const cookieOptions = getCookieOptions({ returnDomain: false });
    Cookie.remove('connected_did', cookieOptions);
    Cookie.remove('connected_pk', cookieOptions);
    Cookie.remove('connected_app', cookieOptions);
    Cookie.remove('connected_wallet_os', cookieOptions);
    removeToken();
  };

  class SessionProvider extends Component<ProviderProps, ProviderState> {
    listeners: { [key: string]: Function[] };

    service: AxiosInstance;

    constructor(props: ProviderProps) {
      super(props);

      const { serviceHost, action } = this.props;

      this.service = createService(serviceHost, storage);
      this.state = {
        action,
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
      const { appendAuthServicePrefix: appendPrefix, prefix } = this.props;
      if (appendAuthServicePrefix && appendPrefix) {
        return `${AUTH_SERVICE_PREFIX}${prefix}`;
      }
      return prefix;
    }

    // 不可以直接个性 props.autoConnect (readonly)
    get autoConnect() {
      const { autoConnect, autoLogin } = this.props;
      // for backward compatibility
      if (typeof autoConnect === 'boolean') {
        return autoConnect;
      }
      return !!autoLogin;
    }

    componentDidMount() {
      const { autoDisconnect } = this.props;
      // ensure we are in the same app
      const connectedApp = Cookie.get('connected_app');
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
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
          window.history.replaceState({}, (window as any).title, url.href);
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
          this.setState({ error: (err as any).message, loading: false, open: false });
        } else {
          this.setState({ error: (err as any).message, open: false });
        }
      } finally {
        if (setInitialized) {
          this.setState({ initialized: true });
        }
      }
    }

    login(done: any) {
      if (this.state.user) {
        return;
      }
      if (typeof done === 'function') {
        this.listeners.login.push(done);
      }
      this.setState({ open: true, action: 'login' });
    }

    logout(done: any) {
      // 避免 disconnect 后自动连接
      const cookieOptions = getCookieOptions({ returnDomain: false });
      Cookie.remove('connected_wallet_os', cookieOptions);
      Cookie.remove('connected_app', cookieOptions);
      removeToken();
      this.setState({ user: null, error: '', open: false, loading: false }, done);
    }

    switchDid(done: any) {
      clearSession();
      this.setState({ user: null, error: '', open: false, loading: false }, done);
    }

    switchProfile(done: any) {
      if (!this.state.user) {
        return;
      }
      if (typeof done === 'function') {
        this.listeners['switch-profile'].push(done);
      }
      this.setState({ open: true, action: 'switch-profile' });
    }

    switchPassport(done: any) {
      if (!this.state.user) {
        return;
      }
      if (typeof done === 'function') {
        this.listeners['switch-passport'].push(done);
      }
      this.setState({ open: true, action: 'switch-passport' });
    }

    onLogin(result: any, decrypt: any) {
      const { loginToken, sessionToken } = result;
      const token = loginToken || sessionToken;
      if (token) {
        setToken(decrypt(token));
        this.setState({ loading: false }, async () => {
          await this.refresh(true);
          while (this.listeners.login.length) {
            const cb = this.listeners.login.shift();
            try {
              // @ts-ignore
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

    onClose(action: any) {
      this.setState({ open: false });
      this.listeners[action] = [];
    }

    render() {
      // @ts-ignore
      const { children, locale, timeout, extraParams, webWalletUrl, messages, ...rest } = this.props;
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
      const callbacks: { [key: string]: Function } = {
        login: this.onLogin,
        'switch-profile': this.onSwitchProfile,
        'switch-passport': this.onLogin,
      };

      return (
        <Provider value={state}>
          {!open && typeof children === 'function' ? (children as Function)(state) : children}
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

  function withSession(InnerComponent: any) {
    return function WithSessionComponent(props: any) {
      return <Consumer>{(sessionProps) => <InnerComponent {...props} {...sessionProps} />}</Consumer>;
    };
  }

  return { SessionProvider, SessionConsumer: Consumer, SessionContext, withSession };
}

export function createAuthServiceSessionContext({ storageEngine = 'cookie' } = {}) {
  const storageKey = 'login_token';

  if (storageEngine === 'cookie') {
    let path = '/';

    if (typeof window !== 'undefined') {
      const env = (window as any).env || {};
      const blocklet = (window as any).blocklet || {};

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
