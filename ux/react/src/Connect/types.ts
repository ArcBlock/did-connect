import type { TEventCallback, TConnectCallback, TApproveCallback } from '@did-connect/state';
import { SessionTimeout } from '@did-connect/types';

export interface ConnectProps {
  onConnect: TConnectCallback;
  onApprove: TApproveCallback;
  messages: { [key: string]: string };

  onClose?: TEventCallback;
  onStart?: TEventCallback;
  onCreate?: TEventCallback;
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

  // connect related
  extraContent?: any;
  showDownload?: boolean;
  qrcodeSize?: number;
}
