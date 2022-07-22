/* eslint-disable react/jsx-filename-extension */
import { action } from '@storybook/addon-actions';
import { sleep, profileRequest, defaultActions } from './fixtures';
import Connect from '..';

export default function Demo(props) {
  const handleOnCreate = async (ctx, e) => {
    action('onCreate')(ctx, e);
    await sleep(1000);
  };
  const handleOnConnect = async (ctx, e) => {
    action('onConnect')(ctx, e);
    await sleep(1000);
    return [[profileRequest]];
  };
  const handleOnApprove = async (ctx, e) => {
    action('onApprove')(ctx, e);
    await sleep(1000);
    return { successMessage: 'approved' };
  };

  return (
    <Connect
      messages={{
        title: 'Profile Required',
        scan: 'Connect your DID Wallet to profile profile',
        confirm: 'Confirm login on your DID Wallet',
        success: 'You profile accepted',
      }}
      {...defaultActions}
      onCreate={handleOnCreate}
      onConnect={handleOnConnect}
      onApprove={handleOnApprove}
      {...props}
    />
  );
}
