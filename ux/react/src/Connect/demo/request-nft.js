/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { defaultActions, assetRequest } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const [open, setOpen] = useState(false);
  const [message] = useState('Prove NFT Ownership');
  const [response, setResponse] = useState(null);
  const handleClose = () => {
    action('close')();
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
    <div>
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
      {response && <CodeBlock language="json">{JSON.stringify(response, null, 2)}</CodeBlock>}
      <Connect
        popup
        open={open}
        messages={{
          title: 'NFT Required',
          scan: 'Please provide a NFT acquired from https://launcher.staging.arcblock.io',
          confirm: 'Confirm on your DID Wallet',
          success: 'NFT accepted',
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
