import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';
import { useTheme } from '@mui/styles';
import Cookie from 'js-cookie';
import Box from '@mui/material/Box';
import useMeasure from 'react-use/lib/useMeasure';
import Img from '@arcblock/ux/lib/Img';
import { openWebWallet } from '@arcblock/ux/lib/Util';
import Spinner from '@arcblock/ux/lib/Spinner';
import colors from '@arcblock/ux/lib/Colors';
import DidWalletLogo from '@arcblock/icons/lib/DidWalletLogo';
import { useBrowserEnvContext } from './contexts/browser';
import translations from './assets/locale';
import DidAddress from '../Address';
import DidAvatar from '../Avatar';
import { StatusCard, MobileWalletCard, ConnectWebWalletCard, ConnectMobileWalletCard, GetWalletCard } from './card';
import {
  getWebWalletUrl,
  checkSameProtocol,
  isSessionFinalized,
  isSessionActive,
  isSessionLoading,
  noop,
} from '../utils';

// #442, 页面初始化时的可见性, 如果不可见 (比如通过在某个页面中右键在新标签页中打开的一个基于 did-connect 登录页) 则禁止自动弹出 web wallet 窗口
const initialDocVisible = !document.hidden;

const getAppDid = (publisher) => {
  if (!publisher) {
    return '';
  }
  return publisher.split(':').pop();
};

function AppIcon({ appInfo, ...rest }) {
  const [error, setError] = React.useState(false);
  if (error) {
    return <DidAvatar did={appInfo.publisher} size={32} />;
  }
  return <Img src={appInfo.icon} alt={appInfo.title} width={32} height={32} {...rest} onError={() => setError(true)} />;
}

AppIcon.propTypes = {
  appInfo: PropTypes.object.isRequired,
};

// FIXME: reuse existing session is not working
export default function BasicConnect({
  locale,
  tokenKey,
  messages,
  qrcodeSize,
  showDownload,
  webWalletUrl,
  session,
  generate,
  cancel,
  enabledConnectTypes,
  onRecreateSession,
  extraContent,
  loadingEle,
  ...rest
}) {
  const { context, status, deepLink } = session;

  // eslint-disable-next-line no-param-reassign
  webWalletUrl = useMemo(() => webWalletUrl || getWebWalletUrl(), [webWalletUrl]);
  // eslint-disable-next-line no-param-reassign
  locale = translations[locale] ? locale : 'en';

  const isSameProtocol = checkSameProtocol(webWalletUrl);
  const theme = useTheme();

  const [ref, { width }] = useMeasure();
  // const matchSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const matchSmallScreen = width < 600;
  const { isWalletWebview, isMobile } = useBrowserEnvContext();
  const [isNativeCalled, setNativeCalled] = useState(false);
  const [isWebWalletOpened, setWebWalletOpened] = useState(false);
  const [cancelCounter, setCancelCounter] = useState(0);

  const getDeepLink = () => {
    let link = deepLink;

    if (isMobile) {
      link = deepLink.replace(/^https?:\/\//, 'abt://');

      let callbackUrl = window.location.href;
      if (callbackUrl.indexOf('?') > 0) {
        callbackUrl += `&${tokenKey}=${context.sessionId}`;
      } else {
        callbackUrl += `?${tokenKey}=${context.sessionId}`;
      }

      callbackUrl = encodeURIComponent(callbackUrl);
      if (deepLink.indexOf('?') > 0) {
        link += `&callback=${callbackUrl}&callback_delay=1500`;
      } else {
        link += `?callback=${callbackUrl}&callback_delay=1500`;
      }
    }

    return link;
  };

  const handleRetry = () => {
    onRecreateSession();
    // inExistingSession 为 true 时不重新生成 token
    if (!session.inExistingSession) {
      setNativeCalled(false);
      generate();
    }
  };

  const handleCancel = () => {
    onRecreateSession();
    if (!session.inExistingSession) {
      setCancelCounter(cancelCounter + 1);
      cancel();
    }
  };

  const handleRefresh = () => {
    onRecreateSession();
    if (!session.inExistingSession) {
      generate(false);
    }
  };

  useEffect(() => {
    const link = getDeepLink();
    if (status === 'created' && link && !isNativeCalled) {
      import('dsbridge').then((jsBridge) => {
        jsBridge.call('authAction', { action: 'auth', link });
      });
      setNativeCalled(true);
    }
  }, [session]); // eslint-disable-line

  const onGoWebWallet = (url) => {
    openWebWallet({ webWalletUrl, url, locale });
  };

  let showWebWalletCard = false;
  let showNativeWalletCard = false;
  if (['created', 'timeout'].includes(status) && !isWalletWebview) {
    if (enabledConnectTypes.includes('web') && isSameProtocol) {
      showWebWalletCard = true;
    }
    showNativeWalletCard = enabledConnectTypes.includes('mobile');
  }

  const shouldAutoConnect = useMemo(() => {
    if (cancelCounter > 0) {
      return false;
    }
    if (status === 'created') {
      // 自动唤起 native wallet
      if (isWalletWebview && getDeepLink()) {
        return true;
      }
      // 自动弹起 web wallet
      if (
        showWebWalletCard &&
        status === 'created' &&
        initialDocVisible &&
        Cookie.get('connected_wallet_os') === 'web'
      ) {
        return true;
      }
    }
    return false;
  }, [status, showWebWalletCard]); // eslint-disable-line

  // wallet webview 环境下, 除 final 状态外, 其他状态都显示 loading (#245)
  const showLoading = isSessionLoading(status) || (isWalletWebview && isSessionFinalized(status) === false);

  // 进行中或者结束状态都展示 Status
  const showStatus = isSessionActive(status) || isSessionFinalized(status);
  const showConnectMobileWalletCard = !showLoading && (isWalletWebview || isMobile);

  if (showLoading) {
    return <LoadingContainer>{loadingEle || <Spinner style={{ color: colors.did.primary }} />}</LoadingContainer>;
  }

  // 如果满足下列条件, 则自动连接 web wallet
  // - "connect with web wallet" 可用
  // - token 刚创建 (created)
  // - cookie 中 connected_wallet_os === 'web'
  // - !isWebWalletOpened (未打开过 web wallet auth 窗口)
  // - 页面可见
  if (
    showWebWalletCard &&
    status === 'created' &&
    Cookie.get('connected_wallet_os') === 'web' &&
    !isWebWalletOpened &&
    initialDocVisible
  ) {
    onGoWebWallet(deepLink);
    setWebWalletOpened(true);
  }

  const statusMessages = {
    confirm: messages.confirm, // scanned
    success: messages.success,
    error: context.error || '',
  };

  console.log('session', status, context);

  return (
    <Root {...rest} theme={theme} ref={ref} data-did-auth-url={deepLink}>
      <div className="auth_inner">
        {!showStatus && context.appInfo && (
          <AppInfo>
            <AppIcon appInfo={context.appInfo} />
            <div className="app-info_content">
              <Box className="app-info_name">{context.appInfo.name}</Box>
              {context.appInfo.publisher && (
                <DidAddress size={14} className="app-info_did">
                  {getAppDid(context.appInfo.publisher)}
                </DidAddress>
              )}
            </div>
          </AppInfo>
        )}

        {!showStatus && (
          <ActionInfo theme={theme}>
            <h6 className="action-info_title">{messages.title}</h6>
            {messages.scan && <p className="action-info_desc">{messages.scan}</p>}
          </ActionInfo>
        )}

        <Main isMobile={isMobile} className={matchSmallScreen ? 'auth_main--small' : ''}>
          <div>
            {!showStatus && !shouldAutoConnect && (
              <Box display="flex" alignItems="center" justifyContent="center">
                <Box color="#999" fontSize={14} fontWeight={400} lineHeight={1}>
                  {translations[locale].connect}
                </Box>
                <DidWalletLogo style={{ height: '1em', marginLeft: 8 }} />
              </Box>
            )}
            {!showStatus && shouldAutoConnect && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                flexWrap="wrap"
                lineHeight="24px"
                color="#999"
                fontSize={14}
                fontWeight={400}
              >
                <Spinner size={12} style={{ color: colors.did.primary }} />
                <Box display="flex" alignItems="center" ml={1} lineHeight={1}>
                  {translations[locale].connecting}
                  <DidWalletLogo style={{ height: '1em', marginLeft: 8 }} />
                </Box>
                <Box ml={1}>{translations[locale].connectingSuffix}</Box>
              </Box>
            )}
            <div className="auth_main-inner">
              {showStatus && (
                <StatusCard
                  status={status}
                  onCancel={handleCancel}
                  onRetry={handleRetry}
                  messages={statusMessages}
                  locale={locale}
                  className="auth_status"
                />
              )}
              {(showWebWalletCard || showNativeWalletCard) && (
                <div className="auth_connect-types">
                  {!isMobile && showWebWalletCard && (
                    <ConnectWebWalletCard
                      className="auth_connect-type"
                      layout={matchSmallScreen ? 'lr' : 'tb'}
                      status={status}
                      onRefresh={handleRefresh}
                      onClick={() => onGoWebWallet(deepLink)}
                      webWalletUrl={webWalletUrl}
                    />
                  )}
                  {showNativeWalletCard && (
                    <MobileWalletCard
                      className="auth_connect-type"
                      qrcodeSize={qrcodeSize}
                      status={status}
                      deepLink={deepLink}
                      onRefresh={handleRefresh}
                      layout={matchSmallScreen ? 'lr' : 'tb'}
                    />
                  )}
                  {/* TODO: onClick => open deepLink */}
                  {showConnectMobileWalletCard && (
                    <ConnectMobileWalletCard
                      deepLink={getDeepLink()}
                      className="auth_connect-type"
                      status={status}
                      onRefresh={handleRefresh}
                      layout={matchSmallScreen ? 'lr' : 'tb'}
                    />
                  )}
                </div>
              )}
            </div>

            {!isWalletWebview && (
              <GetWalletCard
                locale={locale}
                width={1}
                p={2}
                pb={1}
                mt={2}
                visibility={showStatus ? 'hidden' : 'visible'}
              />
            )}

            {(showWebWalletCard || showNativeWalletCard) && extraContent}
          </div>
        </Main>
      </div>
    </Root>
  );
}

BasicConnect.propTypes = {
  locale: PropTypes.oneOf(['en', 'zh']),
  tokenKey: PropTypes.string,
  qrcodeSize: PropTypes.number,
  webWalletUrl: PropTypes.string,
  messages: PropTypes.shape({
    title: PropTypes.string.isRequired,
    scan: PropTypes.string.isRequired,
    confirm: PropTypes.string.isRequired,
    success: PropTypes.any.isRequired,
  }).isRequired,
  showDownload: PropTypes.bool,

  session: PropTypes.object.isRequired,
  generate: PropTypes.func.isRequired,
  cancel: PropTypes.func.isRequired,

  // web, mobile 开关, 默认都启用
  enabledConnectTypes: PropTypes.array,
  // 以下 3 种情况下 (需要重新创建 session) onRecreateSession 会被调用
  // 1. auth 过程中产生错误且用户点击了 retry 按钮
  // 2. 钱包扫码后中断 auth 流程, 且用户点击了 Back 按钮
  // 3. token 过期且用户点击了刷新按钮
  // 如果 did connect 接入的是一个 existingSession, 调用方可以使用该回调来处理 session 的重新创建
  onRecreateSession: PropTypes.func,
  // did connect 初始界面附加内容 (获取 did wallet 文本下面的区域)
  extraContent: PropTypes.any,
  //  支持loadingEle prop, 允许传入自定义的 spinner 元素
  loadingEle: PropTypes.any,
};

BasicConnect.defaultProps = {
  locale: 'en',
  tokenKey: 'sid',
  qrcodeSize: 184,
  showDownload: true,
  webWalletUrl: '',

  enabledConnectTypes: ['web', 'mobile'],
  onRecreateSession: noop,
  extraContent: null,
  loadingEle: '',
};

const centerMixin = css`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

const Root = styled.div`
  ${centerMixin};
  position: relative;
  height: 100%;
  overflow-y: auto;
  line-height: 1.2;
  font-family: 'Lato';
  color: #334660;
  background-color: #fbfcfd;

  &,
  & *,
  & *:before,
  & *:after {
    box-sizing: border-box;
  }

  .auth_inner {
    width: 100%;
    margin: auto 0;
    padding: 40px 16px;
  }
`;

const LoadingContainer = styled.div`
  ${centerMixin};
  height: 100%;
  min-width: 160px;
  min-height: 160px;
`;
const AppInfo = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  left: 24px;
  right: 24px;
  top: 24px;
  font-size: 16px;
  font-weight: 700;
  color: #222;

  /* 禁止 app icon shrink */
  > *:first-child {
    flex: 0 0 auto;
  }

  .app-info_content {
    padding-left: 16px;
    overflow: hidden;
  }

  .app-info_name {
    max-width: 100%;
    padding-right: 32px;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .app-info_did .did-address__text {
    color: #666;
    font-size: 12px;
  }
`;
const ActionInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 48px;
  text-align: center;
  .action-info_title {
    margin: 0;
    font-size: 28px;
    color: #222;
  }
  .action-info_desc {
    margin: 8px 0 0 0;
    font-size: 18px;
    color: #9397a1;
  }
  ${(props) => props.theme.breakpoints.down('md')} {
    .action-info_title {
      font-size: 24px;
    }
    .action-info_desc {
      font-size: 14px;
    }
  }
`;
const Main = styled.main`
  ${centerMixin};
  margin-top: 48px;
  .auth_main-inner {
    ${centerMixin};
    align-items: stretch;
    height: 264px;
    margin-top: 24px;
  }
  .auth_connect-type {
    width: 264px;
  }
  .auth_status {
    width: auto;
  }
  .auth_connect-types {
    ${centerMixin};
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    align-items: stretch;
    flex-wrap: wrap;
  }
  .auth_connect-type + .auth_connect-type {
    margin-left: 24px;
  }

  /* 窄屏样式 */
  &.auth_main--small {
    .auth_main-inner {
      height: auto;
    }
    .auth_connect-types {
      align-items: center;
      flex-direction: column;
    }
    .auth_connect-type {
      width: 340px;
    }
    .auth_connect-type + .auth_connect-type {
      margin: 24px 0 0 0;
    }
  }
`;
