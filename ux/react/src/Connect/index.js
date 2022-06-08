import React from 'react';
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
  onError,
  onClose,
  prefix,
  timeout,
  locale,
  tokenKey,
  encKey,
  baseUrl,
  autoConnect,
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
    onError,
    onClose,
    locale,
    autoConnect,
  });

  const connectProps = {
    ...rest,
    session,
    generate,
    cancel,
    locale,
    tokenKey,
    encKey,
  };

  return (
    <BrowserEnvProvider>
      <BasicConnect key={session.context.sessionId} {...connectProps} />
    </BrowserEnvProvider>
  );
}

Connect.propTypes = {
  onClose: PropTypes.func,
  onError: PropTypes.func,
  onCreate: PropTypes.func,
  onConnect: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onComplete: PropTypes.func,
  prefix: PropTypes.string,
  timeout: PropTypes.number,
  locale: PropTypes.oneOf(['en', 'zh']),
  tokenKey: PropTypes.string,
  encKey: PropTypes.string,
  baseUrl: PropTypes.string,
  autoConnect: PropTypes.bool,
};

const noop = () => null;
Connect.defaultProps = {
  prefix: '/api/connect/relay',
  onClose: noop,
  onError: noop,
  onCreate: noop,
  onComplete: noop,
  // TODO: split this timeout or calculate
  timeout: 60000, // 1 minute
  locale: 'en',
  tokenKey: '_t_',
  encKey: '_ek_',
  baseUrl: '',
  autoConnect: true,
};

export default withWebWalletSWKeeper(withDialog(Connect));
