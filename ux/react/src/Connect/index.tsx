import { SessionTimeout } from '@did-connect/types';

import BasicConnect from './basic';
import { BrowserEnvProvider } from './contexts/browser';
import withDialog from './withDialog';
import { withWebWalletSWKeeper } from '../WebWalletSWKeeper';
import useSession from './hooks/session';
import { ConnectProps } from './types';

import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';

const noop = () => null;
const defaultProps = {
  prefix: '/api/connect/relay',
  onClose: noop,
  onStart: noop,
  onCreate: noop,
  onComplete: noop,
  onTimeout: noop,
  onCancel: noop,
  onReject: noop,
  onError: noop,
  timeout: SessionTimeout,
  locale: 'en',
  webWalletUrl: '',
  baseUrl: '',
  autoConnect: true,
  saveConnect: true,
  onlyConnect: false,
};

function Connect(props: ConnectProps): JSX.Element {
  const {
    onStart,
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
  } = { ...defaultProps, ...props };

  const { session, generate, cancel } = useSession({
    baseUrl,
    timeout,
    prefix,
    onStart,
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

export default withWebWalletSWKeeper(withDialog(Connect));
