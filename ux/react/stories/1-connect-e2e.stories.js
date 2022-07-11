/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@arcblock/ux/lib/Button';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { toBase58 } from '@ocap/util';
import { fromAddress, fromPublicKey } from '@ocap/wallet';
import Client from '@ocap/client';
import objectHash from 'object-hash';
import joinUrl from 'url-join';
import type { TProfileRequest, TAssetRequest } from '@did-connect/types';

import Connect from '../src/Connect';
import { BrowserEnvContext } from '../src/Connect/contexts/browser';

// eslint-disable-next-line no-promise-executor-return
const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

// TODO: deploy this to staging server
const baseUrl = 'https://dfe45b38-znkntry8ptmrcty8b2mnmapp4bs3bx8n844d.did.abtnet.io';
const relayUrl = joinUrl(baseUrl, '/api/connect/relay');
const webWalletUrl = `${window.location.protocol}//wallet.staging.arcblock.io`;
const chainHost = 'https://beta.abtnetwork.io/api/';

const profileRequest: TProfileRequest = {
  type: 'profile',
  items: ['fullName', 'email', 'avatar'],
  description: 'Please give me your profile',
};
const assetRequest: TAssetRequest = {
  type: 'asset',
  filters: [
    {
      // https://launcher.staging.arcblock.io/
      trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
    },
  ],
  description: 'Please provide NFT issued by Blocklet Launcher (Staging)',
};

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
  return [[profileRequest]];
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
          relayUrl={relayUrl}
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
          relayUrl={relayUrl}
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
      return [[profileRequest]];
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
          relayUrl={relayUrl}
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
      return [[assetRequest]];
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
          relayUrl={relayUrl}
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
        [
          {
            type: 'verifiableCredential',
            item: ['ABTNodePassport'],
            trustedIssuers: ['zNKjT5VBGNEzh4p6V4dsaYE61e7Pxxn3vk4j'],
            optional: false,
            description: 'Please provide passport issued by Blocklet Server(Staging)',
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
          relayUrl={relayUrl}
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
        [
          {
            type: 'signature',
            typeUrl: 'mime:text/plain',
            origin: toBase58('DID Connect is Awesome'),
            description: 'Please sign the message',
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
        <Typography gutterBottom>
          In some cases, app may want user to sign some text to authorize the app to do something.
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
            title: 'Signature Required',
            scan: 'Please sign the message',
            confirm: 'Confirm on your DID Wallet',
            success: 'Sig accepted',
          }}
          webWalletUrl={webWalletUrl}
          relayUrl={relayUrl}
        />
      </TestContainer>
    );
  })
  .add('Request Digest Signature', () => {
    const data = {
      key: 'value',
      key2: 'value2',
    };

    const [open, setOpen] = useState(false);
    const [message] = useState('Sign Data Digest');
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
            type: 'signature',
            typeUrl: 'mime:text/plain',
            digest: toBase58(objectHash(data)),
            description: 'Please sign the data hash',
            meta: data,
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
        <Typography gutterBottom>
          In some cases, when the data to be signed is too large to display in DID Wallet, the app shall request the
          Wallet to sign the digest of the data.
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
            title: 'Signature Required',
            scan: 'Please sign the digest of a big piece of data',
            confirm: 'Confirm on your DID Wallet',
            success: 'Signature accepted',
          }}
          webWalletUrl={webWalletUrl}
          relayUrl={relayUrl}
        />
      </TestContainer>
    );
  })
  .add('Request Transaction Signature', () => {
    const client = new Client(chainHost);
    const [open, setOpen] = useState(false);
    const [message] = useState('Sign Transaction');
    const [response, setResponse] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      const app = fromAddress(ctx.appInfo.publisher.split(':').pop());
      const user = fromPublicKey(e.userPk);
      const value = (await client.fromTokenToUnit(1)).toString(10);
      const { buffer: tx } = await client.encodeTransferV2Tx({
        tx: {
          from: user.address,
          pk: user.publicKey,
          itx: {
            to: app.address,
            // https://beta.abtnetwork.io/explorer/tokens/z35n6UoHSi9MED4uaQy6ozFgKPaZj2UKrurBG/transactions
            tokens: [{ address: 'z35n6UoHSi9MED4uaQy6ozFgKPaZj2UKrurBG', value }],
          },
        },
        wallet: user,
      });

      return [
        [
          {
            type: 'signature',
            typeUrl: 'fg:t:transaction',
            origin: toBase58(tx),
            description: 'Please sign this transaction to transfer 1 TBA to the app',
            chainInfo: {
              host: chainHost,
            },
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
        <Typography gutterBottom>
          When the app needs user to sign some transaction that can be broadcast to arcblock chain.
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
            title: 'Signature Required',
            scan: 'Please sign the transaction to send relay server 1 TBA',
            confirm: 'Confirm on your DID Wallet',
            success: 'Tx signed but not broadcasted',
          }}
          webWalletUrl={webWalletUrl}
          relayUrl={relayUrl}
        />
      </TestContainer>
    );
  })
  .add('Request Payment', () => {
    const client = new Client(chainHost);
    const [open, setOpen] = useState(false);
    const [message] = useState('Pay 1 TBA');
    const [response, setResponse] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      const app = fromAddress(ctx.appInfo.publisher.split(':').pop());
      const user = fromPublicKey(e.userPk);
      const value = (await client.fromTokenToUnit(1)).toString(10);
      const { buffer: tx } = await client.encodeTransferV3Tx({
        tx: {
          itx: {
            inputs: [],
            outputs: [
              {
                owner: app.address,
                // https://beta.abtnetwork.io/explorer/tokens/z35n6UoHSi9MED4uaQy6ozFgKPaZj2UKrurBG/transactions
                tokens: [{ address: 'z35n6UoHSi9MED4uaQy6ozFgKPaZj2UKrurBG', value }],
              },
            ],
          },
        },
        wallet: user,
      });

      return [
        [
          {
            type: 'prepareTx',
            partialTx: toBase58(tx),
            description: 'Please sign this transaction to transfer 1 TBA to the app',
            requirement: {
              tokens: [
                {
                  address: 'z35n6UoHSi9MED4uaQy6ozFgKPaZj2UKrurBG',
                  value,
                },
              ],
            },
            chainInfo: {
              host: chainHost,
            },
          },
        ],
      ];
    };

    const handleApprove = async (ctx, e) => {
      action('onApprove')(ctx, e);
      // TODO: send tx to blockchain
      setResponse(e);
    };

    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setOpen(false);
    };

    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>When the app needs user to pay some token to get some service.</Typography>
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
            title: 'Payment Required',
            scan: 'Please prepare the payment to continue',
            confirm: 'Confirm on your DID Wallet',
            success: 'Payment signed but not broadcasted',
          }}
          webWalletUrl={webWalletUrl}
          relayUrl={relayUrl}
        />
      </TestContainer>
    );
  })
  .add('Request Ethereum Signature', () => {
    return (
      <TestContainer height={780}>
        <Typography variant="p" gutterBottom>
          TODO
        </Typography>
      </TestContainer>
    );
  })
  .add('Multiple Claims', () => {
    const [open, setOpen] = useState(false);
    const [message] = useState('Multiple Claims');
    const [response, setResponse] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      return [[profileRequest, assetRequest]];
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
          relayUrl={relayUrl}
        />
      </TestContainer>
    );
  })
  .add('Remote API', () => {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('Login');
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setMessage(`Hello ${ctx.responseClaims[0][0].fullName}`);
      setOpen(false);
    };
    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>
          Sometimes you need to call a remote API to get requested claims and then complete the session. You can pass
          valid URL to `onConnect` or `onApprove` to leverage backend API.
        </Typography>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        <Connect
          popup
          open={open}
          onClose={handleClose}
          onConnect={joinUrl(baseUrl, '/connect/profile')}
          onApprove={joinUrl(baseUrl, '/approve/profile')}
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
          relayUrl={relayUrl}
        />
      </TestContainer>
    );
  })
  .add('Multiple Steps', () => {
    const [open, setOpen] = useState(false);
    const [message] = useState('Multiple Steps');
    const [response1, setResponse1] = useState(null);
    const [response2, setResponse2] = useState(null);
    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      return [[profileRequest], [assetRequest]];
    };

    const handleApprove = async (ctx, e) => {
      action('onApprove')(ctx, e);
      if (e.currentStep === 0) {
        setResponse1(e);
      }
      if (e.currentStep === 1) {
        setResponse2(e);
      }
    };

    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setOpen(false);
    };

    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>Request profile and then present NFT ownership.</Typography>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        {response1 && <pre>{JSON.stringify(response1, null, 2)}</pre>}
        {response2 && <pre>{JSON.stringify(response2, null, 2)}</pre>}
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
          relayUrl={relayUrl}
        />
      </TestContainer>
    );
  })
  .add('Multiple Workflows', () => {
    const [open, setOpen] = useState(false);
    const [message] = useState('Multiple Workflows');
    const [response1, setResponse1] = useState(null);
    const [response2, setResponse2] = useState(null);

    const handleClose = () => {
      action('close');
      setOpen(false);
    };
    const handleConnect = async (ctx, e) => {
      action('onConnect')(ctx, e);
      return [[profileRequest]];
    };

    const handleApprove = async (ctx, e) => {
      action('onApprove')(ctx, e);
      if (e.currentStep === 0) {
        setResponse1(e);
      }
      if (e.currentStep === 1) {
        setResponse2(e);
      }
    };

    // {
    //   // https://launcher.staging.arcblock.io/
    //   type: 'asset',
    //   filters: [{ trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'] }],
    //   description: 'Please provide NFT issued by Blocklet Launcher (Staging)',
    // },

    const handleComplete = (ctx, e) => {
      action('onComplete')(ctx, e);
      setOpen(false);
    };

    return (
      <TestContainer height={780} resize="true">
        <Typography gutterBottom>You can concat multiple workflows form different apps.</Typography>
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
        {response1 && <pre>{JSON.stringify(response1, null, 2)}</pre>}
        {response2 && <pre>{JSON.stringify(response2, null, 2)}</pre>}
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
          relayUrl={relayUrl}
        />
      </TestContainer>
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
