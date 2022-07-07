import { SessionTimeout } from '@did-connect/types';

import BasicConnect from './basic';
import { BrowserEnvProvider } from './contexts/browser';
import withDialog from './with-dialog';
import { withWebWalletSWKeeper } from '../WebWalletSWKeeper';
import useSession from './hooks/session';
import { TConnectProps, THookProps, TBasicProps, THookResult } from '../types';

import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';

const noop = () => {};
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

function Connect(props: TConnectProps): JSX.Element {
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

  const hookProps: THookProps = {
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
    autoConnect,
    saveConnect,
    onlyConnect,
  };
  const { session, generate, cancel }: THookResult = useSession(hookProps);

  const connectProps: TBasicProps = {
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
