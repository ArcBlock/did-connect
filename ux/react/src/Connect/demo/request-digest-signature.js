/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { toBase58 } from '@ocap/util';
import objectHash from 'object-hash';
import { defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const data = {
    key: 'value',
    key2: 'value2',
  };

  const [open, setOpen] = useState(false);
  const [message] = useState('Sign Data Digest');
  const [response, setResponse] = useState(null);
  const handleClose = () => {
    action('close')();
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
    <div>
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
        messages={{
          title: 'Signature Required',
          scan: 'Please sign the digest of a big piece of data',
          confirm: 'Confirm on your DID Wallet',
          success: 'Signature accepted',
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
