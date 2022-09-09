/* eslint-disable react/jsx-filename-extension */
import { useState } from 'react';
import CodeBlock from '@arcblock/ux/lib/CodeBlock';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const [open, setOpen] = useState(false);
  const [message] = useState('Present Passport');
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
          type: 'verifiableCredential',
          item: ['ABTNodePassport'],
          trustedIssuers: ['zNKjT5VBGNEzh4p6V4dsaYE61e7Pxxn3vk4j'],
          optional: false,
          description: 'Please provide passport issued by Blocklet Server(Staging)',
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
        Please admin a passport vc from{' '}
        <a href="https://node-dev-1.arcblock.io/admin/" target="_blank" rel="noreferrer">
          node-dev-1.arcblock.io
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
          title: 'VC Required',
          scan: 'Please provide a NFT obtained from https://node-dev-1.arcblock.io/admin/',
          confirm: 'Confirm on your DID Wallet',
          success: 'VC accepted',
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
