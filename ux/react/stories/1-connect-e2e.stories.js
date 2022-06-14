import { useState } from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@arcblock/ux/lib/Button';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { toBase58 } from '@ocap/util';

import Connect from '../src/Connect';
import { BrowserEnvContext } from '../src/Connect/contexts/browser';

// eslint-disable-next-line no-promise-executor-return
const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

// TODO: deploy this to staging server
const baseUrl = 'https://did-connect-relay-server-vwb-192-168-123-127.ip.abtnet.io';

// TODO: make this usable
const webWalletUrl = `${window.location.protocol}//www.abtnode.com`;

const noop = () => undefined;
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
  await sleep(1000);
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
  await sleep(1000);
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
          messages={{
            title: 'Profile Required',
            scan: 'Connect your DID Wallet to profile profile',
            confirm: 'Confirm login on your DID Wallet',
            success: 'You profile accepted',
          }}
          webWalletUrl={webWalletUrl}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
  .add('Request DID Only', () => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('Connect');
    const [connectedUser, setConnectedUser] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setMessage('You are now connected');
      setConnectedUser(ctx.currentConnected);
      setOpen(false);
    };
    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>If the app just need the user did, you can enable `onlyConnect` mode.</Typography>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        {connectedUser && <p>DID: {connectedUser.userDid}</p>}
        <Connect
          popup
          open={open}
          onlyConnect
          onClose={handleClose}
          onStart={onStart}
          onCreate={onCreate}
          onConnect={noop}
          onApprove={onApprove}
          onComplete={handleComplete}
          onReject={onReject}
          onCancel={onCancel}
          onTimeout={onTimeout}
          onError={onError}
          messages={{
            title: 'Connect DID Wallet',
            scan: 'You will always see the app connection screen on DID Wallet when scan follow qrcode',
            confirm: 'Confirm operation on your DID Wallet',
            success: 'You have successfully connected!',
          }}
          webWalletUrl={webWalletUrl}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
  .add('Request Profile', () => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('Login');
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      return [
        {
          type: 'profile',
          fields: ['fullName', 'email', 'avatar'],
          description: 'Please give me your profile',
        },
      ];
    };
    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setMessage(`Hello ${ctx.responseClaims[0][0].fullName}`);
      setOpen(false);
    };
    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>
          If the app need user name/email to function properly, you can request a profile from the user.
        </Typography>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        <Connect
          popup
          open={open}
          onClose={handleClose}
          onConnect={handleConnect}
          onApprove={onApprove}
          onComplete={handleComplete}
          onReject={onReject}
          onCancel={onCancel}
          onTimeout={onTimeout}
          onError={onError}
          messages={{
            title: 'Profile Required',
            scan: 'You can manage and provide your profile in your DID Wallet',
            confirm: 'Confirm on your DID Wallet',
            success: 'Profile accepted',
          }}
          webWalletUrl={webWalletUrl}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
  .add('Request NFT', () => {
    const [open, setOpen] = useState(false);
    const [message] = useState('Prove NFT Ownership');
    const [response, setResponse] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      return [
        {
          type: 'asset',
          filters: [
            {
              // https://launcher.staging.arcblock.io/
              trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
            },
          ],
          description: 'Please provide NFT issued by Blocklet Launcher (Staging)',
        },
      ];
    };

    // Verify the ownership of the NFT
    const handleApprove = async (ctx, e) => {
      action('onApprove')(ctx, e);
      setResponse(e);
    };

    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setOpen(false);
    };
    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>
          Please purchase a Server Ownership NFT from{' '}
          <a href="https://launcher.staging.arcblock.io/" target="_blank" rel="noreferrer">
            launcher.staging.arcblock.io
          </a>{' '}
          before click following button.
        </Typography>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
        <Connect
          popup
          open={open}
          onClose={handleClose}
          onConnect={handleConnect}
          onApprove={handleApprove}
          onComplete={handleComplete}
          onReject={onReject}
          onCancel={onCancel}
          onTimeout={onTimeout}
          onError={onError}
          messages={{
            title: 'NFT Required',
            scan: 'Please provide a NFT acquired from https://launcher.staging.arcblock.io',
            confirm: 'Confirm on your DID Wallet',
            success: 'NFT accepted',
          }}
          webWalletUrl={webWalletUrl}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
  .add('Request Verifiable Credential', () => {
    const [open, setOpen] = useState(false);
    const [message] = useState('Present Passport');
    const [response, setResponse] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      return [
        {
          type: 'verifiableCredential',
          item: ['ABTNodePassport'],
          trustedIssuers: ['zNKjT5VBGNEzh4p6V4dsaYE61e7Pxxn3vk4j'],
          optional: false,
          description: 'Please provide passport issued by Blocklet Server(Staging)',
        },
      ];
    };

    const handleApprove = async (ctx, e) => {
      action('onApprove')(ctx, e);
      setResponse(e);
    };

    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setOpen(false);
    };
    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>
          Please admin a passport vc from{' '}
          <a href="https://node-dev-1.arcblock.io/admin/" target="_blank" rel="noreferrer">
            node-dev-1.arcblock.io
          </a>{' '}
          before click following button.
        </Typography>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
        <Connect
          popup
          open={open}
          onClose={handleClose}
          onConnect={handleConnect}
          onApprove={handleApprove}
          onComplete={handleComplete}
          onReject={onReject}
          onCancel={onCancel}
          onTimeout={onTimeout}
          onError={onError}
          messages={{
            title: 'VC Required',
            scan: 'Please provide a NFT obtained from https://node-dev-1.arcblock.io/admin/',
            confirm: 'Confirm on your DID Wallet',
            success: 'VC accepted',
          }}
          webWalletUrl={webWalletUrl}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
  .add('Request Text Signature', () => {
    const [open, setOpen] = useState(false);
    const [message] = useState('Sign Random Text');
    const [response, setResponse] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      return [
        {
          type: 'signature',
          typeUrl: 'mime:text/plain',
          origin: toBase58('DID Connect is Awesome'),
          description: 'Please sign the message',
        },
      ];
    };

    const handleApprove = async (ctx, e) => {
      action('onApprove')(ctx, e);
      setResponse(e);
    };

    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setOpen(false);
    };

    return (
      <TestContainer height={780} resize="true">
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
        <Connect
          popup
          open={open}
          onClose={handleClose}
          onConnect={handleConnect}
          onApprove={handleApprove}
          onComplete={handleComplete}
          onReject={onReject}
          onCancel={onCancel}
          onTimeout={onTimeout}
          onError={onError}
          messages={{
            title: 'Signature Required',
            scan: 'Please sign the message',
            confirm: 'Confirm on your DID Wallet',
            success: 'Sig accepted',
          }}
          webWalletUrl={webWalletUrl}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
  .add('Request Digest Signature', () => {
    const [open, setOpen] = useState(false);
    const [message] = useState('Sign Digest for Data');
    const [response, setResponse] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      return [
        {
          type: 'signature',
          typeUrl: 'fg:t:transaction',
          description: 'Please provide passport issued by Blocklet Server(Staging)',
        },
      ];
    };

    const handleApprove = async (ctx, e) => {
      action('onApprove')(ctx, e);
      setResponse(e);
    };

    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setOpen(false);
    };

    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>
          Please admin a passport vc from{' '}
          <a href="https://node-dev-1.arcblock.io/admin/" target="_blank" rel="noreferrer">
            node-dev-1.arcblock.io
          </a>{' '}
          before click following button.
        </Typography>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
        <Connect
          popup
          open={open}
          onClose={handleClose}
          onConnect={handleConnect}
          onApprove={handleApprove}
          onComplete={handleComplete}
          onReject={onReject}
          onCancel={onCancel}
          onTimeout={onTimeout}
          onError={onError}
          messages={{
            title: 'VC Required',
            scan: 'Please provide a NFT obtained from https://node-dev-1.arcblock.io/admin/',
            confirm: 'Confirm on your DID Wallet',
            success: 'VC accepted',
          }}
          webWalletUrl={webWalletUrl}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
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
  .add('Request Multiple Claims', () => {
    const [open, setOpen] = useState(false);
    const [message] = useState('Multiple Claims');
    const [response, setResponse] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      return [
        [
          {
            type: 'profile',
            fields: ['fullName', 'email', 'avatar'],
            description: 'Please give me your profile',
          },
          {
            // https://launcher.staging.arcblock.io/
            type: 'asset',
            filters: [{ trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'] }],
            description: 'Please provide NFT issued by Blocklet Launcher (Staging)',
          },
        ],
      ];
    };

    const handleApprove = async (ctx, e) => {
      action('onApprove')(ctx, e);
      setResponse(e);
    };

    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setOpen(false);
    };

    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>Request profile and NFT ownership in a single session.</Typography>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
        <Connect
          popup
          open={open}
          onClose={handleClose}
          onConnect={handleConnect}
          onApprove={handleApprove}
          onComplete={handleComplete}
          onReject={onReject}
          onCancel={onCancel}
          onTimeout={onTimeout}
          onError={onError}
          messages={{
            title: 'Profile and NFT Required',
            scan: 'You must provide profile and NFT to continue',
            confirm: 'Confirm on your DID Wallet',
            success: 'Claims accepted',
          }}
          webWalletUrl={webWalletUrl}
          baseUrl={baseUrl}
        />
      </TestContainer>
    );
  })
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
