/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { profileRequest, defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('Login');
  const [response, setResponse] = useState(null);

  const handleClose = () => {
    action('close')();
    setOpen(false);
  };

  const handleConnect = async (ctx, e) => {
    action('onConnect')(ctx, e);
    return [[profileRequest]];
  };

  const handleApprove = async (ctx, e) => {
    action('onApprove')(ctx, e);
    setResponse(e);
  };

  const handleComplete = (ctx, e) => {
    action('onComplete')(ctx, e);
    setMessage(`Hello ${ctx.responseClaims[0][0].fullName}`);
    setOpen(false);
  };
  return (
    <div>
      <Typography gutterBottom>
        If the app need user name/email to function properly, you can request a profile from the user.
      </Typography>
      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        {message}
      </Button>
      {response && <CodeBlock language="json">{JSON.stringify(response, null, 2)}</CodeBlock>}
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
        onConnect={handleConnect}
        onApprove={handleApprove}
        onComplete={handleComplete}
        {...props}
      />
    </div>
  );
}
