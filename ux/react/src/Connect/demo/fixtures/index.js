import joinUrl from 'url-join';
import { action } from '@storybook/addon-actions';

// eslint-disable-next-line no-promise-executor-return
export const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

export const profileRequest = {
  type: 'profile',
  items: ['fullName', 'email', 'avatar'],
  description: 'Please give me your profile',
};
export const assetRequest = {
  type: 'asset',
  filters: [
    {
      // https://launcher.staging.arcblock.io/
      trustedIssuers: ['zNKjDm4Xsoaffb19UE6QxVeevuaTaLCS1n1S'],
    },
  ],
  description: 'Please provide NFT issued by Blocklet Launcher (Staging)',
};

export const baseUrl =
  process.env.NODE_ENV === 'production' ? '/relay' : 'https://did-connect-relay-server-vwb-192-168-1-87.ip.abtnet.io';
export const relayUrl = joinUrl(baseUrl, '/api/connect/relay');
export const chainHost = 'https://beta.abtnetwork.io/api/';
export const connectUrl = joinUrl(baseUrl, '/connect/profile');
export const approveUrl = joinUrl(baseUrl, '/approve/profile');

export const defaultActions = {
  onStart: action('onStart'),
  onClose: action('onClose'),
  onError: action('onError'),
  onComplete: action('onComplete'),
  onCancel: action('onCancel'),
  onReject: action('onReject'),
  onTimeout: action('onTimeout'),
  onCreate: action('onCreate'),
  onConnect: action('onConnect'),
  onApprove: action('onApprove'),
};
