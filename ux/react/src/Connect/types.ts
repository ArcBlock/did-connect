import type { TEventCallback, TConnectCallback, TApproveCallback } from '@did-connect/state';
import { SessionTimeout } from '@did-connect/types';

export type ConnectProps = {
  onClose?: TEventCallback;
  onStart?: TEventCallback;
  onCreate?: TEventCallback;
  onConnect: TConnectCallback;
  onApprove: TApproveCallback;
  onComplete?: TEventCallback;
  onTimeout?: TEventCallback;
  onCancel?: TEventCallback;
  onReject?: TEventCallback;
  onError?: TEventCallback;
  prefix?: string;
  timeout?: typeof SessionTimeout;
  locale?: 'en' | 'zh';
  webWalletUrl?: string;
  baseUrl?: string;
  autoConnect?: boolean;
  saveConnect?: boolean;
  onlyConnect?: boolean;
};
