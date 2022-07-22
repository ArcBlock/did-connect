/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { toBase58 } from '@ocap/util';
import { defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const [open, setOpen] = useState(false);
  const [message] = useState('Sign Random Text');
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
    <div>
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
        messages={{
          title: 'Signature Required',
          scan: 'Please sign the message',
          confirm: 'Confirm on your DID Wallet',
          success: 'Sig accepted',
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
