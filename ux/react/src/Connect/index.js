import React from 'react';
import PropTypes from 'prop-types';

import useToken from './hooks/token';
import BasicConnect from './basic';
import { BrowserEnvProvider } from './contexts/browser';
import withDialog from './withDialog';
import { withWebWalletSWKeeper } from '../WebWalletSWKeeper';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';

/**
 * - 将 token state (useToken) 提升到这里 (提升 BasicConnect 上层, 方便 BasicConnect 独立测试)
 */
function Connect({
  onConnect,
  onApprove,
  onError,
  onClose,
  prefix,
  checkTimeout,
  locale,
  tokenKey,
  encKey,
  baseUrl,
  autoConnect,
  ...rest
}) {
  const { state, generate, cancel } = useToken({
    baseUrl,
    checkTimeout,
    prefix,
    onConnect,
    onApprove,
    onError,
    onClose,
    locale,
    tokenKey,
    encKey,
    autoConnect,
  });

  const connectProps = {
    ...rest,
    session: state,
    generate,
    cancel,
    locale,
    tokenKey,
    encKey,
  };

  return (
    <BrowserEnvProvider>
      <BasicConnect {...connectProps} />
    </BrowserEnvProvider>
  );
}

Connect.propTypes = {
  onClose: PropTypes.func,
  onError: PropTypes.func,
  onConnect: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  prefix: PropTypes.string,
  checkTimeout: PropTypes.number,
  locale: PropTypes.oneOf(['en', 'zh']),
  tokenKey: PropTypes.string,
  encKey: PropTypes.string,
  baseUrl: PropTypes.string,
  autoConnect: PropTypes.bool,
};

Connect.defaultProps = {
  prefix: '/api/did',
  onClose: () => {},
  onError: () => {},
  // TODO: split this timeout or calculate
  checkTimeout: 60000, // 1 minute
  locale: 'en',
  tokenKey: '_t_',
  encKey: '_ek_',
  baseUrl: '',
  autoConnect: true,
};

export default withWebWalletSWKeeper(withDialog(Connect));
