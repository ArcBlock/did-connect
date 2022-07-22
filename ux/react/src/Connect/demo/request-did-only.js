/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('Connect');
  const [connectedUser, setConnectedUser] = useState(null);
  const handleClose = () => {
    action('onClose')();
    setOpen(false);
  };
  const handleComplete = (ctx, e) => {
    action('onComplete')(ctx, e);
    setMessage('You are now connected');
    setConnectedUser(ctx.currentConnected);
    setOpen(false);
  };
  return (
    <div>
      <Typography gutterBottom>If the app just need the user did, you can enable `onlyConnect` mode.</Typography>
      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        {message}
      </Button>
      {connectedUser && <p>DID: {connectedUser.userDid}</p>}
      <Connect
        popup
        open={open}
        onlyConnect
        messages={{
          title: 'Connect DID Wallet',
          scan: 'You will always see the app connection screen on DID Wallet when scan follow qrcode',
          confirm: 'Confirm operation on your DID Wallet',
          success: 'You have successfully connected!',
        }}
        {...defaultActions}
        onClose={handleClose}
        onComplete={handleComplete}
        {...props}
      />
    </div>
  );
}
