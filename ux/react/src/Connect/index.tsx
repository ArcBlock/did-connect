import BasicConnect from './basic';
import { BrowserEnvProvider } from './contexts/browser';
import withDialog from './withDialog';
import { withWebWalletSWKeeper } from '../WebWalletSWKeeper';
import useSession from './hooks/session';

import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';

interface ConnectProps {
  onClose?(...args: unknown[]): unknown;
  onCreate?(...args: unknown[]): unknown;
  onConnect(...args: unknown[]): unknown;
  onApprove(...args: unknown[]): unknown;
  onComplete?(...args: unknown[]): unknown;
  onTimeout?(...args: unknown[]): unknown;
  onCancel?(...args: unknown[]): unknown;
  onReject?(...args: unknown[]): unknown;
  onError?(...args: unknown[]): unknown;
  prefix?: string;
  timeout?: {
    app?: number;
    relay?: number;
    wallet?: number;
  };
  locale?: 'en' | 'zh';
  webWalletUrl?: string;
  baseUrl?: string;
  autoConnect?: boolean;
  saveConnect?: boolean;
  onlyConnect?: boolean;
}

/**
 * - 将 token state (useToken) 提升到这里 (提升 BasicConnect 上层, 方便 BasicConnect 独立测试)
 */
function Connect({
  onCreate,
  onConnect,
  onApprove,
  onComplete,
  onTimeout,
  onReject,
  onCancel,
  onError,
  onClose,
  prefix,
  timeout,
  locale,
  webWalletUrl,
  baseUrl,
  autoConnect,
  saveConnect,
  onlyConnect,
  ...rest
}: ConnectProps) {
  const { session, generate, cancel } = useSession({
    baseUrl,
    timeout,
    prefix,
    onCreate,
    onConnect,
    onApprove,
    onComplete,
    onTimeout,
    onReject,
    onCancel,
    onError,
    onClose,
    locale,
    autoConnect,
    saveConnect,
    onlyConnect,
  });

  const connectProps = {
    ...rest,
    session,
    generate,
    cancel,
    locale,
    webWalletUrl,
  };

  return (
    <BrowserEnvProvider>
      <BasicConnect key={session.context.sessionId} {...connectProps} />
    </BrowserEnvProvider>
  );
}

const noop = () => null;
Connect.defaultProps = {
  prefix: '/api/connect/relay',
  onClose: noop,
  onCreate: noop,
  onComplete: noop,
  onTimeout: noop,
  onCancel: noop,
  onReject: noop,
  onError: noop,
  timeout: {
    app: 10 * 1000,
    relay: 10 * 1000,
    wallet: 60 * 1000,
  },
  locale: 'en',
  webWalletUrl: '',
  baseUrl: '',
  autoConnect: true,
  saveConnect: true,
  onlyConnect: false,
};

export default withWebWalletSWKeeper(withDialog(Connect));
