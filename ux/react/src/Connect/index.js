import PropTypes from 'prop-types';

import BasicConnect from './basic';
import { BrowserEnvProvider } from './contexts/browser';
import withDialog from './withDialog';
import { withWebWalletSWKeeper } from '../WebWalletSWKeeper';
import useSession from './hooks/session';

import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';

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
  onlyConnect,
  ...rest
}) {
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

Connect.propTypes = {
  onClose: PropTypes.func,
  onCreate: PropTypes.func,
  onConnect: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onComplete: PropTypes.func,
  onTimeout: PropTypes.func,
  onCancel: PropTypes.func,
  onReject: PropTypes.func,
  onError: PropTypes.func,
  prefix: PropTypes.string,
  timeout: PropTypes.object({
    app: PropTypes.number,
    relay: PropTypes.number,
    wallet: PropTypes.number,
  }),
  locale: PropTypes.oneOf(['en', 'zh']),
  webWalletUrl: PropTypes.string,
  baseUrl: PropTypes.string,
  autoConnect: PropTypes.bool,
  onlyConnect: PropTypes.bool,
};

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
  onlyConnect: false,
};

export default withWebWalletSWKeeper(withDialog(Connect));
