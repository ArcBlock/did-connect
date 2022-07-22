/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { connectUrl, approveUrl, defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('Login');
  const handleClose = () => {
    action('close')();
    setOpen(false);
  };
  const handleComplete = (ctx, e) => {
    action('onComplete')(ctx, e);
    setMessage(`Hello ${ctx.responseClaims[0][0].fullName}`);
    setOpen(false);
  };
  return (
    <div>
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
        messages={{
          title: 'Profile Required',
          scan: 'You can manage and provide your profile in your DID Wallet',
          confirm: 'Confirm on your DID Wallet',
          success: 'Profile accepted',
        }}
        {...defaultActions}
        onClose={handleClose}
        onConnect={connectUrl}
        onApprove={approveUrl}
        onComplete={handleComplete}
        {...props}
      />
    </div>
  );
}
