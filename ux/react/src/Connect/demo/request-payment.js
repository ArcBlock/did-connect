/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
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
  const [message] = useState('Pay 1 TBA');
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
          description: 'Please sign this transaction to pay 1 TBA to the app with any account',
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
    <div>
      <Typography gutterBottom>When the app needs user to pay some token to get some service.</Typography>
      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        {message}
      </Button>
      {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
      <Connect
        popup
        open={open}
        messages={{
          title: 'Payment Required',
          scan: 'Please prepare the payment to continue',
          confirm: 'Confirm on your DID Wallet',
          success: 'Payment signed but not broadcasted',
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
