import type { TEventCallback, TConnectCallback, TApproveCallback } from '@did-connect/state';
import { TLocaleCode, SessionTimeout, TSession, TSessionStatus } from '@did-connect/types';
import { LiteralUnion } from 'type-fest';

export type TWalletCode = LiteralUnion<'web' | 'native', string>;

export type ConnectMessages = {
  title: string;
  scan: string;
  confirm: string;
  success: any;
  error?: string;
};

export type HookProps = {
  onConnect: TConnectCallback;
  onApprove: TApproveCallback;

  onStart?: TEventCallback;
  onCreate?: TEventCallback;
  onComplete?: TEventCallback;
  onTimeout?: TEventCallback;
  onCancel?: TEventCallback;
  onReject?: TEventCallback;
  onError?: TEventCallback;

  prefix?: string;
  timeout?: typeof SessionTimeout;
  baseUrl?: string;

  autoConnect?: boolean;
  saveConnect?: boolean;
  onlyConnect?: boolean;
};

export type HookResult = {
  sessionId: string;
  dispatch: (...args: any[]) => any;
  generate: (...args: any[]) => any;
  cancel: (...args: any[]) => any;
  session: {
    context: TSession;
    status: TSessionStatus;
    deepLink: string;
  };
};

export type ConnectProps = HookProps & {
  onClose?: TEventCallback;

  locale?: TLocaleCode;
  webWalletUrl?: string;
  extraContent?: any;
  showDownload?: boolean;
  qrcodeSize?: number;
  loadingEle?: any;
  enabledConnectTypes?: TWalletCode[];
  messages: ConnectMessages;
};

export type UIProps = ConnectProps & Pick<HookResult, 'session' | 'generate' | 'cancel'>;
