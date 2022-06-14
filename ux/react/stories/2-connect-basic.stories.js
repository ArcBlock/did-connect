import React, { useEffect } from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import LocaleSelector from '@arcblock/ux/lib/Locale/selector';
import { LocaleProvider } from '@arcblock/ux/lib/Locale/context';
import Cookies from 'js-cookie';
import BasicConnect from '../src/Connect/basic';
import Connect from '../src/Connect';
import { BrowserEnvContext } from '../src/Connect/contexts/browser';
import { createFakeCheckFn, messages } from './util';

const longUrl = `https://abtwallet.io/i/?action=requestAuth&url=https%253A%252F%252Fkitchen-sink-blocklet-pft-adminurl-192-168-2-3.ip.abtnet.io%252F.service%252F%2540abtnode%252Fauth-service%252Fapi%252Fdid%252Fissue-passport%252Fauth%253F_t_%253D0c39741d&extra=${'abcdefg'.repeat(
  30
)}`;

const makeConnectProps = (session, props) => {
  return Object.assign(
    {
      session: Object.assign(
        {
          appInfo: {
            // eslint-disable-next-line prettier/prettier
            icon: 'https://node-dev-1.arcblock.io/admin/blocklet/logo/z8iZjySpAu4jzbMochL9k1okuji1GcS7RRRDM',
            name: 'my-app-name',
            publisher: 'did:abt:zNKYkwPJHM4V44YSJ23AxZaHpky9e72SmoKs',
          },
        },
        session
      ),
      prefix: '',
      messages: {
        title: 'My Action Name',
        scan: 'My App action instruction',
        confirm: 'Confirm this request on your Wallet',
        success: 'You have successfully signed in!',
      },
      generate: () => {},
      cancel: () => {},
      webWalletUrl: `${window.location.protocol}//wallet.staging.arcblock.io`,
    },
    props
  );
};

/**
 * stories
 */
storiesOf('DID-Connect/Connect', module)
  .addParameters({
    readme: {
      sidebar: '<!-- PROPS -->',
    },
  })
  .add('status/loading', () => (
    <Box p={2}>
      <h5>fixed size container</h5>
      <TestContainer width={300} height={300} resize="true">
        <BasicConnect {...makeConnectProps({ loading: true })} />
      </TestContainer>

      <h5>content-based size container</h5>
      <Box display="inline-block" overflow="auto">
        <BasicConnect {...makeConnectProps({ loading: true })} />
      </Box>
    </Box>
  ))
  .add('status/created', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect
        {...makeConnectProps({
          status: 'created',
          // eslint-disable-next-line prettier/prettier
          url: 'https://abtwallet.io/i/?action=requestAuth&url=https%253A%252F%252Fplayground.staging.arcblock.io%252F.well-known%252Fservice%252Fapi%252Fdid%252Flogin%252Fauth%253F_t_%253D14b9ba1a',
        })}
      />
    </TestContainer>
  ))
  .add('status/created with extraContent', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect
        {...makeConnectProps(
          {
            status: 'created',
            url: longUrl,
          },
          {
            extraContent: (
              <Box fontSize={12} textAlign="center">
                <Link href="/" underline="hover">
                  Lost your passport? Recover it from here.
                </Link>
              </Box>
            ),
          }
        )}
      />
    </TestContainer>
  ))
  .add('status/created & autoConnect', () => {
    Cookies.set('connected_wallet_os', 'web');
    useEffect(() => {
      return () => {
        Cookies.remove('connected_wallet_os');
      };
    }, []);
    return (
      <TestContainer width={720} height={780} resize="true">
        <BasicConnect
          {...makeConnectProps({
            status: 'created',
            url: longUrl,
            connectedDid: 'xxx',
            saveConnect: true,
          })}
        />
      </TestContainer>
    );
  })
  .add('status/created & NOT isSameProtocol', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect
        {...makeConnectProps({ status: 'created', url: 'dummy-url' }, { webWalletUrl: 'custom-protocol://url' })}
      />
    </TestContainer>
  ))
  .add('status/scanned', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect {...makeConnectProps({ status: 'scanned', url: 'dummy-url' })} />
    </TestContainer>
  ))
  .add('status/succeed', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect {...makeConnectProps({ status: 'succeed', url: 'dummy-url' })} />
    </TestContainer>
  ))
  .add('status/error', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect {...makeConnectProps({ status: 'error' })} />
    </TestContainer>
  ))
  .add('timeout (refresh)', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect {...makeConnectProps({ status: 'timeout', url: 'dummy-url' })} />
    </TestContainer>
  ))
  .add('connectTypes/connect-with-web-wallet', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect {...makeConnectProps({ status: 'created', url: 'dummy-url' })} enabledConnectTypes={['web']} />
    </TestContainer>
  ))
  .add('connectTypes/scan-with-mobile-wallet', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect {...makeConnectProps({ status: 'created', url: 'dummy-url' })} enabledConnectTypes={['mobile']} />
    </TestContainer>
  ))
  // TODO: token 状态和浏览器环境组合状态比较多 - 考虑使用 knobs / dat.gui 类似的方法
  // created + wallet-webview => loading
  .add('status/created & wallet-webview', () => (
    <TestContainer width={720} height={780} resize="true">
      <BrowserEnvContext.Provider value={{ isWalletWebview: true }}>
        <BasicConnect {...makeConnectProps({ status: 'created' })} />
      </BrowserEnvContext.Provider>
    </TestContainer>
  ))
  .add('status/created & mobile-browser & isSameProtocol', () => (
    <TestContainer width={375} height={880} resize="true">
      <BrowserEnvContext.Provider value={{ isMobile: true }}>
        <BasicConnect {...makeConnectProps({ status: 'created', url: 'dummy-url' })} />
      </BrowserEnvContext.Provider>
    </TestContainer>
  ))
  .add('api-mocking/default', () => {
    return (
      <TestContainer width={720} height={780} resize="true">
        <Connect
          prefix=""
          checkFn={createFakeCheckFn('default')}
          onClose={action('login.close')}
          onSuccess={action('login.success')}
          messages={messages}
          webWalletUrl={webWalletUrl}
        />
      </TestContainer>
    );
  })
  .add('api-mocking/popup', () => {
    const [open, setOpen] = React.useState(false);
    const handleClose = () => {
      action('login.close');
      setOpen(false);
    };
    return (
      <TestContainer width={100} height={100}>
        <button type="button" onClick={() => setOpen(true)}>
          Open
        </button>
        <Connect
          popup
          open={open}
          prefix=""
          checkFn={createFakeCheckFn('default')}
          onClose={handleClose}
          onSuccess={action('login.success')}
          messages={messages}
          webWalletUrl={webWalletUrl}
          dialogStyle={{ height: 800 }}
        />
      </TestContainer>
    );
  })
  .add('api-mocking/checkInterval 500', () => (
    <TestContainer width={720} height={780}>
      <Connect
        popup
        open
        prefix=""
        checkInterval={500}
        checkFn={createFakeCheckFn('interval')}
        onClose={action('login.close')}
        onSuccess={action('login.success')}
        messages={messages}
        webWalletUrl={webWalletUrl}
      />
    </TestContainer>
  ))
  .add('api-mocking/checkTimeout 4000', () => (
    <TestContainer width={720} height={780}>
      <Connect
        popup
        open
        prefix=""
        checkInterval={2000}
        checkTimeout={4000}
        checkFn={createFakeCheckFn('timeout', 2000, 0)}
        onClose={action('login.close')}
        onSuccess={action('login.success')}
        messages={messages}
        webWalletUrl={webWalletUrl}
      />
    </TestContainer>
  ))
  .add('api-mocking/throw error', () => (
    <TestContainer width={720} height={780}>
      <Connect
        popup
        open
        prefix=""
        checkFn={createFakeCheckFn('error')}
        onClose={action('login.close')}
        onSuccess={action('login.success')}
        messages={messages}
        webWalletUrl={webWalletUrl}
      />
    </TestContainer>
  ))
  .add('api-mocking/long messages', () => (
    <TestContainer width={720} height={780}>
      <Connect
        popup
        open
        prefix=""
        checkFn={createFakeCheckFn('login')}
        onClose={action('login.close')}
        onSuccess={action('login.success')}
        webWalletUrl={webWalletUrl}
        messages={{
          title: 'login',
          scan: 'Scan QR code with DID Wallet'.repeat(2),
          confirm: 'Confirm login on your DID Wallet'.repeat(2),
          success: 'You have successfully signed in!'.repeat(2),
        }}
      />
    </TestContainer>
  ))
  .add('api-mocking/i18n', () => {
    const [locale, setLocale] = React.useState('en');
    const [open, setOpen] = React.useState(false);
    const handleLocaleChange = (newLocale) => {
      setLocale(newLocale);
    };
    const handleClose = () => {
      action('login.close');
      setOpen(false);
    };
    return (
      <LocaleProvider locale={locale} translations={{}}>
        <TestContainer width={720} height={780}>
          <Box display="flex" alignItems="center">
            <button type="button" onClick={() => setOpen(true)} style={{ marginRight: 8 }}>
              Open
            </button>
            <LocaleSelector onChange={handleLocaleChange} />
          </Box>
          <Connect
            popup
            open={open}
            prefix=""
            locale={locale}
            checkFn={createFakeCheckFn('login', 1000)}
            onClose={handleClose}
            onSuccess={action('login.success')}
            messages={messages}
            webWalletUrl={`${window.location.protocol}//wallet.staging.arcblock.io`}
          />
        </TestContainer>
      </LocaleProvider>
    );
  })
  .add('broken app icon', () => {
    const props = makeConnectProps({
      appInfo: {
        icon: 'https://invalid-app-icon',
        name: 'my-app-name',
        publisher: 'did:abt:zNKYkwPJHM4V44YSJ23AxZaHpky9e72SmoKs',
      },
      status: 'created',
      url: 'dummy-url',
    });
    return (
      <TestContainer width={720} height={780} resize="true">
        <BasicConnect {...props} />
      </TestContainer>
    );
  })
  .add('long app name/action messages', () => {
    const props = makeConnectProps(
      {
        appInfo: {
          // eslint-disable-next-line prettier/prettier
          icon: 'https://node-dev-1.arcblock.io/admin/blocklet/logo/z8iZjySpAu4jzbMochL9k1okuji1GcS7RRRDM',
          name: 'My app name '.repeat(5),
          publisher: 'did:abt:zNKYkwPJHM4V44YSJ23AxZaHpky9e72SmoKs',
        },
        status: 'created',
        url: 'dummy-url',
      },
      {
        messages: {
          title: 'My Action Name '.repeat(5),
          scan: 'My action instruction '.repeat(5),
          confirm: 'Confirm this request on your Wallet',
          success: 'You have successfully signed in!',
        },
      }
    );
    return (
      <TestContainer width={400} height={880} resize="true">
        <BasicConnect {...props} />
      </TestContainer>
    );
  })
  .add('long error message', () => (
    <TestContainer width={720} height={780} resize="true">
      <BasicConnect
        {...makeConnectProps({
          status: 'error',
          error: 'We_encountered_some_errors_when_processing_the_request '.repeat(7),
        })}
      />
    </TestContainer>
  ))
  .add('custom loading element', () => {
    return (
      <TestContainer width={300} height={300} resize="true">
        <BasicConnect
          {...makeConnectProps({ loading: true })}
          loadingEle={<div style={{ color: '#aaa', fontSize: 12 }}>Loading...</div>}
        />
      </TestContainer>
    );
  });

// eslint-disable-next-line react/prop-types
function TestContainer({ children, ...rest }) {
  // 模拟最常见的 PC 的情况, 该环境会显示 connect with web wallet 和 scan with mobile wallet
  const defaultBrowserEnv = {
    isWalletWebview: false,
    isMobile: false,
  };
  return (
    <BrowserEnvContext.Provider value={defaultBrowserEnv}>
      <TestContainerRoot {...rest}>{children}</TestContainerRoot>
    </BrowserEnvContext.Provider>
  );
}

// resize="true" - https://github.com/styled-components/styled-components/issues/1198
const TestContainerRoot = styled(Box)`
  padding: 8px;
  border: 1px solid #ddd;
  background-color: #eee;
  ${(props) =>
    props.resize
      ? `
    overflow: auto;
    resize: both;
  `
      : ''};
`;
