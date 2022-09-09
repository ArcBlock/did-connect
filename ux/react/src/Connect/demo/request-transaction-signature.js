/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import Client from '@ocap/client';
import { toBase58 } from '@ocap/util';
import { fromAddress, fromPublicKey } from '@ocap/wallet';
import { defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const chainHost = 'https://beta.abtnetwork.io/api/';
  const client = new Client(chainHost);
  const [open, setOpen] = useState(false);
  const [message] = useState('Sign Transaction');
  const [response, setResponse] = useState(null);
  const handleClose = () => {
    action('close')();
    setOpen(false);
  };
  const handleConnect = async (ctx, e) => {
    action('onConnect')(ctx, e);
    const app = fromAddress(ctx.appInfo.publisher.split(':').pop());
    const user = fromPublicKey(e.currentConnected.userPk);
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
          description: 'Please sign this transaction to pay 1 TBA to the app with current account',
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
    <div>
      <Typography gutterBottom>
        When the app needs user to sign some transaction that can be broadcast to arcblock chain.
      </Typography>
      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        {message}
      </Button>
      {response && <CodeBlock language="json">{JSON.stringify(response, null, 2)}</CodeBlock>}
      <Connect
        popup
        open={open}
        messages={{
          title: 'Signature Required',
          scan: 'Please sign the transaction to send relay server 1 TBA',
          confirm: 'Confirm on your DID Wallet',
          success: 'Tx signed but not broadcasted',
        }}
        {...defaultActions}
        onClose={handleClose}
        onConnect={handleConnect}
        onApprove={handleApprove}
        onComplete={handleComplete}
        {...props}
      />
    </div>
  );
}
