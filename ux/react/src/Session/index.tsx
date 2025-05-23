/* eslint-disable react/require-default-props */
import { TAnyObject, TSession, TEvent, TLocaleCode, TI18nMessages, SessionTimeout } from '@did-connect/types';
import { createContext, Component, useContext } from 'react';
import { AxiosInstance } from 'axios';
import Cookie from 'js-cookie';
import joinUrl from 'url-join';

import { getCookieOptions } from '@arcblock/ux/lib/Util';
import Center from '@arcblock/ux/lib/Center';
import Spinner from '@mui/material/CircularProgress';

import { TEventCallback } from '@did-connect/state';

import Connect from '../Connect';
import createService from '../Service';
import createStorage from '../Storage';
import { getAppId, updateConnectedInfo } from '../utils';

import { TStorageEngineCode, TStorageEngine, TSessionUser } from '../types';

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
  relayUrl: '/.well-known/service/api/connect/relay',
  sessionUrl: '/.well-known/service/api/did/session',
  autoConnect: true,
  autoDisconnect: true,
  timeout: SessionTimeout,
  webWalletUrl: '',
  messages: null,
};

type ProviderProps = typeof defaultProps & {
  children: React.ReactNode;
  serviceHost: string;
  relayUrl?: string;
  sessionUrl?: string;
  locale?: TLocaleCode;
  timeout?: typeof SessionTimeout;
  autoConnect?: boolean;
  autoDisconnect?: boolean;
  webWalletUrl?: string;
  messages?: I18nGroup;
};

type ProviderState = {
  action: string;
  error: string;
  initialized: boolean;
  loading: boolean;
  open: boolean;
  user?: TSessionUser;
};

type ContextState = {
  api: AxiosInstance;
  session: ProviderState & {
    login(done: any, origin?: string): void;
    logout(done: any): void;
    switchDid(done: any): void;
    switchProfile(done: any): void;
    switchPassport(done: any): void;
    refresh(): void;
    updateConnectedInfo(ctx: TSession): void;
  };
};

const SessionContext = createContext<ContextState>({} as ContextState);

type TSessionContextResult = {
  SessionProvider: React.ComponentType<ProviderProps>;
  SessionConsumer: typeof SessionContext.Consumer;
  SessionContext: typeof SessionContext;
  withSession: (inner: any) => React.FunctionComponent;
  useSessionContext: () => ContextState;
};

const { Provider, Consumer } = SessionContext;

export default function createSessionContext(
  storageKey: string = 'login_token',
  storageEngine: TStorageEngineCode = 'ls',
  storageOptions: TAnyObject = {}
): TSessionContextResult {
  const storage: TStorageEngine = createStorage(storageKey, storageEngine, storageOptions);
  const { getToken, setToken, removeToken } = storage;

  const clearSession = () => {
    // @ts-expect-error
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

    fullProps: ProviderProps;

    constructor(props: ProviderProps) {
      super(props);

      this.fullProps = Object.assign({}, defaultProps, this.props);
      const { serviceHost } = this.fullProps;

      this.service = createService(serviceHost, storage);
      this.state = {
        action: 'login',
        error: '',
        initialized: false,
        loading: false,
        open: false,
        user: undefined,
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

    get autoConnect() {
      const { autoConnect } = this.fullProps;
      return !!autoConnect;
    }

    componentDidMount() {
      const { autoDisconnect } = this.fullProps;
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
        const { sessionUrl } = this.fullProps;

        const { data, status } = await this.service.get(sessionUrl);

        if (status === 400) {
          removeToken();
          if (showProgress) {
            this.setState({ user: undefined, error: '', loading: false });
          } else {
            this.setState({ user: undefined, error: '' });
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

    login(done: any, origin?: string) {
      if (!this.state.user || origin === 'switch-did') {
        if (typeof done === 'function') {
          this.listeners.login.push(done);
        }
        this.setState({ open: true, action: 'login' });
      }
    }

    logout(done: any) {
      // 避免 disconnect 后自动连接
      // @ts-expect-error
      const cookieOptions = getCookieOptions({ returnDomain: false });
      Cookie.remove('connected_wallet_os', cookieOptions);
      Cookie.remove('connected_app', cookieOptions);
      removeToken();
      this.setState({ user: undefined, error: '', open: false, loading: false }, done);
    }

    // See:
    // - https://github.com/ArcBlock/ux/issues/520
    // - https://github.com/ArcBlock/did-connect/issues/56
    switchDid(done: any) {
      // @ts-expect-error
      const cookieOptions = getCookieOptions({ returnDomain: false });
      Cookie.remove('connected_did', cookieOptions);
      Cookie.remove('connected_pk', cookieOptions);
      Cookie.remove('connected_app', cookieOptions);
      Cookie.remove('connected_wallet_os', cookieOptions);
      this.login(done, 'switch-did');
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

    onLogin(session: TSession, e: TEvent) {
      const [result] = session.approveResults;
      if (result.sessionToken) {
        setToken(result.sessionToken);
        this.setState({ loading: false }, async () => {
          await this.refresh(true);
          while (this.listeners.login.length) {
            const cb = this.listeners.login.shift();
            try {
              // @ts-ignore
              cb(session, e);
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
      const { children, locale, timeout, webWalletUrl, messages, relayUrl, ...rest } = this.fullProps;
      const { autoConnect } = this;
      const { action, user, open, initialized, loading } = this.state;

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

      const callbacks: { [key: string]: TEventCallback } = {
        login: this.onLogin,
        'switch-profile': this.onSwitchProfile,
        'switch-passport': this.onLogin,
      };

      return (
        <Provider value={state}>
          {!open && typeof children === 'function' ? (children as Function)(state) : children}
          <Connect
            key={action}
            strategy="smart"
            locale={locale}
            onClose={() => this.onClose(action)}
            onConnect={joinUrl(relayUrl, `/${action}/connect`)}
            onApprove={joinUrl(relayUrl, `/${action}/approve`)}
            onComplete={callbacks[action]}
            timeout={timeout}
            webWalletUrl={webWalletUrl}
            messages={messages || translations[action][locale]}
            popup
            open={open}
            // {...rest} 允许在使用 SessionProvider 时将一些额外的 props 传递到内部的 Connect 组件, 比如 dialogStyle
            {...rest}
            // 注意 relayUrl 经过了特殊处理, 优先级高于 "...rest", 所以放在其后
            relayUrl={relayUrl}
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

  function useSessionContext(): ContextState {
    const result = useContext(SessionContext);
    if (result === undefined) {
      throw new Error('useSession must be inside a SessionProvider with a value');
    }

    return result;
  }

  return { SessionProvider, SessionConsumer: Consumer, SessionContext, withSession, useSessionContext };
}

export function createAuthServiceSessionContext({ storageEngine = 'cookie' } = {}): TSessionContextResult {
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

    return createSessionContext(storageKey, 'cookie', {
      path,
      returnDomain: false,
    });
  }

  if (storageEngine === 'localStorage') {
    return createSessionContext(storageKey, 'ls', {});
  }

  throw new Error('storageEngine must be cookie or localStorage');
}
