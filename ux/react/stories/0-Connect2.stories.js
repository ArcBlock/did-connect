import React from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import LocaleSelector from '@arcblock/ux/lib/Locale/selector';
import { LocaleProvider } from '@arcblock/ux/lib/Locale/context';

import Connect from '../src/Connect/v2';
import { BrowserEnvContext } from '../src/Connect/contexts/browser';
import { messages } from './util';

// eslint-disable-next-line no-promise-executor-return
const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));
const baseUrl = 'https://did-connect-relay-server-vwb-192-168-123-127.ip.abtnet.io';

const onCreate = async (ctx, e) => {
  action('onCreate')(ctx, e);
  await sleep(3000);
};

const onConnect = async (ctx, e) => {
  action('onConnect')(ctx, e);
  await sleep(3000);
  return [
    {
      type: 'profile',
      fields: ['fullName', 'email', 'avatar'],
      description: 'Please give me your profile',
    },
  ];
};
const onApprove = async (ctx, e) => {
  action('onApprove')(ctx, e);
  await sleep(3000);
  return 'approved';
};

/**
 * stories
 */
storiesOf('DID-Connect/Connect2', module)
  .addParameters({
    readme: {
      sidebar: '<!-- PROPS -->',
    },
  })
  .add('api-mocking/default', () => {
    return (
      <TestContainer width={720} height={780} resize="true">
        <Connect
          onClose={action('login.close')}
          onCreate={onCreate}
          onConnect={onConnect}
          onApprove={onApprove}
          onComplete={action('onComplete')}
          messages={messages}
          webWalletUrl={`${window.location.protocol}//www.abtnode.com`}
          baseUrl={baseUrl}
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
          onClose={handleClose}
          onConnect={onConnect}
          onApprove={action('login.success')}
          messages={messages}
          webWalletUrl={`${window.location.protocol}//www.abtnode.com`}
          dialogStyle={{ height: 800 }}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
  .add('api-mocking/timeout 4000', () => (
    <TestContainer width={720} height={780}>
      <Connect
        popup
        open
        timeout={4000}
        onClose={action('login.close')}
        onConnect={onConnect}
        onApprove={action('login.success')}
        messages={messages}
        webWalletUrl={`${window.location.protocol}//www.abtnode.com`}
        baseUrl={baseUrl}
      />
    </TestContainer>
  ))
  .add('api-mocking/throw error', () => (
    <TestContainer width={720} height={780}>
      <Connect
        popup
        open
        onClose={action('login.close')}
        onConnect={onConnect}
        onApprove={action('login.success')}
        messages={messages}
        webWalletUrl={`${window.location.protocol}//www.abtnode.com`}
        baseUrl={baseUrl}
      />
    </TestContainer>
  ))
  .add('api-mocking/long messages', () => (
    <TestContainer width={720} height={780}>
      <Connect
        popup
        open
        onClose={action('login.close')}
        onConnect={onConnect}
        onApprove={action('login.success')}
        webWalletUrl={`${window.location.protocol}//www.abtnode.com`}
        baseUrl={baseUrl}
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
            locale={locale}
            onConnect={onConnect}
            onClose={handleClose}
            onApprove={action('login.success')}
            messages={messages}
            webWalletUrl={`${window.location.protocol}//wallet.staging.arcblock.io`}
            baseUrl={baseUrl}
          />
        </TestContainer>
      </LocaleProvider>
    );
  });

// 模拟最常见的 PC 的情况, 该环境会显示 connect with web wallet 和 scan with mobile wallet
const defaultBrowserEnv = { isWalletWebview: false, isMobile: false };
// eslint-disable-next-line react/prop-types
function TestContainer({ children, ...rest }) {
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
