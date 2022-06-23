import { useState, useEffect, useMemo } from 'react';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'styl... Remove this comment to see the full error message
import styled, { css } from 'styled-components';
import { useTheme } from '@mui/styles';
import Cookie from 'js-cookie';
import Box from '@mui/material/Box';
import useMeasure from 'react-use/lib/useMeasure';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import Img from '@arcblock/ux/lib/Img';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import { openWebWallet } from '@arcblock/ux/lib/Util';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import Spinner from '@arcblock/ux/lib/Spinner';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import colors from '@arcblock/ux/lib/Colors';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
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

const getAppDid = (publisher: any) => {
  if (!publisher) {
    return '';
  }
  return publisher.split(':').pop();
};

type AppIconProps = {
  appInfo: any;
};

function AppIcon({ appInfo, ...rest }: AppIconProps) {
  const [error, setError] = useState(false);
  if (error) {
    return <DidAvatar did={appInfo.publisher} size={32} />;
  }
  return <Img src={appInfo.icon} alt={appInfo.title} width={32} height={32} {...rest} onError={() => setError(true)} />;
}

type OwnBasicConnectProps = {
  locale?: 'en' | 'zh';
  qrcodeSize?: number;
  webWalletUrl?: string;
  messages: {
    title: string;
    scan: string;
    confirm: string;
    success: any;
  };
  showDownload?: boolean;
  session: any;
  generate: (...args: any[]) => any;
  cancel: (...args: any[]) => any;
  enabledConnectTypes?: any[];
  onRecreateSession?: (...args: any[]) => any;
  extraContent?: any;
  loadingEle?: any;
};

// @ts-expect-error ts-migrate(2565) FIXME: Property 'defaultProps' is used before being assig... Remove this comment to see the full error message
type BasicConnectProps = OwnBasicConnectProps & typeof BasicConnect.defaultProps;

// FIXME: reuse existing session is not working
export default function BasicConnect({
  locale,
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
}: BasicConnectProps) {
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

  const getDeepLink = () => (isMobile ? deepLink.replace(/^https?:\/\//, 'abt://') : deepLink);

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
        (jsBridge as any).call('authAction', { action: 'auth', link });
      });
      setNativeCalled(true);
    }
  }, [session]); // eslint-disable-line

  const onGoWebWallet = (url: any) => {
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
                fontWeight={400}>
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

BasicConnect.defaultProps = {
  locale: 'en',
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
  ${(props: any) => props.theme.breakpoints.down('md')} {
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
