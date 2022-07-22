/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { profileRequest, assetRequest, defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const [open, setOpen] = useState(false);
  const [message] = useState('Multiple Claims');
  const [response, setResponse] = useState(null);
  const handleClose = () => {
    action('close')();
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
    <div>
      <Typography gutterBottom>Request profile and NFT ownership in a single session.</Typography>
      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        {message}
      </Button>
      {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
      <Connect
        popup
        open={open}
        messages={{
          title: 'Profile and NFT Required',
          scan: 'You must provide profile and NFT to continue',
          confirm: 'Confirm on your DID Wallet',
          success: 'Claims accepted',
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
