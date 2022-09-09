/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { profileRequest, assetRequest, defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const [open, setOpen] = useState(false);
  const [message] = useState('Multiple Steps');
  const [response1, setResponse1] = useState(null);
  const [response2, setResponse2] = useState(null);
  const handleClose = () => {
    action('close')();
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
    <div>
      <Typography gutterBottom>Request profile and then present NFT ownership.</Typography>
      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        {message}
      </Button>
      {response1 && <CodeBlock language="json">{JSON.stringify(response1, null, 2)}</CodeBlock>}
      {response2 && <CodeBlock language="json">{JSON.stringify(response2, null, 2)}</CodeBlock>}
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
