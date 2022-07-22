/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { relayUrl, connectUrl, approveUrl, defaultActions } from './fixtures';
import Connect, { createSession } from '..';

export default function Demo(props) {
  const [session, setSession] = useState(null);

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('Login');

  const handleCreateSession = async () => {
    // If you want to use remote api as callback, you should set them here
    const result = await createSession({ relayUrl, onConnect: connectUrl, onApprove: approveUrl });
    setSession(result);
  };

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
        In some cases, the session maybe created by other apps. You can reuse the session.
      </Typography>
      {!session && (
        <Button variant="contained" size="small" onClick={handleCreateSession}>
          Create Session
        </Button>
      )}
      {session && (
        <Button variant="contained" size="small" onClick={() => setOpen(true)}>
          {message}
        </Button>
      )}
      {session && (
        <Connect
          popup
          open={open}
          sessionId={session.sessionId}
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
      )}
    </div>
  );
}
