import React from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import Connect from '../src/Connect';
import { BrowserEnvContext } from '../src/Connect/contexts/browser';
import { messages } from './util';

// eslint-disable-next-line no-promise-executor-return
const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

// TODO: deploy this to staging server
const baseUrl = 'https://did-connect-relay-server-vwb-192-168-123-127.ip.abtnet.io';

const onStart = action('onStart');
const onClose = action('onClose');
const onError = action('onError');
const onComplete = action('onComplete');
const onCancel = action('onCancel');
const onReject = action('onReject');
const onTimeout = action('onTimeout');
const onCreate = async (ctx, e) => {
  action('onCreate')(ctx, e);
  await sleep(1000);
};

const onConnect = async (ctx, e) => {
  action('onConnect')(ctx, e);
  await sleep(2000);
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
  await sleep(2000);
  return 'approved';
};

/**
 * stories
 */
storiesOf('DID-Connect/Examples', module)
  .addParameters({
    readme: {
      sidebar: '<!-- PROPS -->',
    },
  })
  .add('LifeCycle Callbacks', () => {
    return (
      <TestContainer width={720} height={780} resize="true">
        <Connect
          onClose={onClose}
          onStart={onStart}
          onCreate={onCreate}
          onConnect={onConnect}
          onApprove={onApprove}
          onComplete={onComplete}
          onReject={onReject}
          onCancel={onCancel}
          onTimeout={onTimeout}
          onError={onError}
          messages={messages}
          webWalletUrl={`${window.location.protocol}//www.abtnode.com`}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
  .add('Request Profile', () => {
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
          onApprove={onApprove}
          onComplete={onComplete}
          onReject={onReject}
          onCancel={onCancel}
          onTimeout={onTimeout}
          onError={onError}
          messages={messages}
          webWalletUrl={`${window.location.protocol}//www.abtnode.com`}
          dialogStyle={{ height: 800 }}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
  .add('Request NFT', () => (
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
  .add('Request Verifiable Credential', () => (
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
  .add('Request Text Signature', () => (
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
  .add('Request Digest Signature', () => (
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
  .add('Request Transaction Signature', () => (
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
  .add('Request Ethereum Signature', () => (
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
  .add('Request Multiple Claims', () => (
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
  .add('Multiple Workflows', () => (
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
  ));

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
