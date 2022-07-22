/* eslint-disable react/jsx-filename-extension */
import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { action } from '@storybook/addon-actions';
import { relayUrl, connectUrl, approveUrl, assetRequest, defaultActions } from './fixtures';
import Connect, { createSession } from '..';

export default function Demo(props) {
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [completed, setCompleted] = useState(false);
  const [message] = useState('Asset --> Profile');
  const [response1, setResponse1] = useState(null);
  const [response2] = useState(null);
  const [nextSession, setNextSession] = useState(null);

  useEffect(() => {
    createSession({ relayUrl, connectUrl, approveUrl }).then((x) => setNextSession(x));
  }, []);

  const handleClose = () => {
    action('close')();
    setOpen(false);
  };
  const handleAssetConnect = async (ctx, e) => {
    action('onConnect')(ctx, e);
    return [[assetRequest]];
  };

  const handleAssetApprove = async (ctx, e) => {
    action('onApprove')(ctx, e);
    setResponse1(e);

    return { nextWorkflow: nextSession.deepLink };
  };

  const handleAssetComplete = (ctx, e) => {
    action('onComplete')(ctx, e);
    setCompleted(true);
    setOpen(false);

    setTimeout(() => {
      setOpen(true);
    }, 5000);
  };

  // const handleProfileComplete = (ctx, e) => {
  //   action('onComplete')(ctx, e);
  //   setResponse2(ctx.responseClaims[0][0]);
  //   setOpen(false);
  // };

  // {completed && open && (
  //   <Connect
  //     key="profile"
  //     popup
  //     open={open}
  //     sessionId={nextSession.sessionId}
  //     onClose={handleClose}
  //     onConnect={connectUrl}
  //     onApprove={approveUrl}
  //     onComplete={handleProfileComplete}
  //     onReject={onReject}
  //     onCancel={onCancel}
  //     onTimeout={onTimeout}
  //     onError={onError}
  //     messages={{
  //       title: 'Profile Required',
  //       scan: 'You must provide profile to continue',
  //       confirm: 'Confirm on your DID Wallet',
  //       success: 'Claims accepted',
  //     }}
  //     relayUrl={relayUrl}
  //   />
  // )}

  return (
    <div>
      <Typography gutterBottom>
        You can concat multiple workflows form different apps, usually the next workflow should use remote API.
      </Typography>
      <Button variant="contained" size="small" onClick={() => setOpen(true)}>
        {message}
      </Button>
      {response1 && <pre>{JSON.stringify(response1, null, 2)}</pre>}
      {response2 && <pre>{JSON.stringify(response2, null, 2)}</pre>}
      <Connect
        key="asset"
        popup
        open={open}
        messages={{
          title: 'NFT Required',
          scan: 'You must provide NFT to continue',
          confirm: 'Confirm on your DID Wallet',
          success: 'Claims accepted',
        }}
        {...defaultActions}
        onClose={handleClose}
        onConnect={handleAssetConnect}
        onApprove={handleAssetApprove}
        onComplete={handleAssetComplete}
        {...props}
      />
    </div>
  );
}
