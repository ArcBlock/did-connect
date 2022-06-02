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
  onClose,
  onSuccess,
  onError,
  action,
  prefix,
  socketUrl,
  checkFn,
  checkInterval,
  checkTimeout,
  extraParams,
  locale,
  tokenKey,
  encKey,
  baseUrl,
  enableAutoConnect,
  ...rest
}) {
  if (typeof checkFn !== 'function') {
    throw new Error('Cannot initialize did connect component without a fetchFn');
  }

  const { state, generate, cancelWhenScanned } = useToken({
    action,
    baseUrl,
    checkFn,
    checkInterval,
    checkTimeout,
    extraParams,
    prefix,
    socketUrl,
    onClose,
    onError,
    onSuccess,
    locale,
    tokenKey,
    encKey,
    enableAutoConnect,
  });

  const connectProps = {
    ...rest,
    tokenState: state,
    generate,
    cancelWhenScanned,
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
  onSuccess: PropTypes.func.isRequired,
  action: PropTypes.string.isRequired,
  checkFn: PropTypes.func.isRequired,
  prefix: PropTypes.string,
  socketUrl: PropTypes.string,
  checkInterval: PropTypes.number,
  checkTimeout: PropTypes.number,
  extraParams: PropTypes.object,
  locale: PropTypes.oneOf(['en', 'zh']),
  tokenKey: PropTypes.string,
  encKey: PropTypes.string,
  baseUrl: PropTypes.string,
  enableAutoConnect: PropTypes.bool,
};

Connect.defaultProps = {
  prefix: '/api/did',
  socketUrl: '',
  onClose: () => {},
  onError: () => {},
  checkInterval: 2000,
  checkTimeout: 60000, // 1 minute
  extraParams: {},
  locale: 'en',
  tokenKey: '_t_',
  encKey: '_ek_',
  baseUrl: '',
  enableAutoConnect: true,
};

export default withWebWalletSWKeeper(withDialog(Connect));
