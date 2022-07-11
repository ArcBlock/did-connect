import type { TEventCallback, TConnectCallback, TApproveCallback } from '@did-connect/state';
import { TLocaleCode, SessionTimeout, TSession, TSessionStatus, TAnyRequest } from '@did-connect/types';
import { LiteralUnion } from 'type-fest';

export type TWalletCode = LiteralUnion<'web' | 'native', string>;

// connect related
export type TConnectMessage = {
  title: string;
  scan: string;
  confirm: string;
  success: any;
  error?: string;
};
export type THookProps = {
  // onConnect can be one of the following:
  // - a function that returns the requestedClaims list
  // - a requestedClaims list
  // - a URL that can be used to retrieve the requestedClaims list
  onConnect: TConnectCallback | TAnyRequest[][] | string;

  // onApprove can be one of the following:
  // - a function that returns the approveResult
  // - a URL that can be used to retrieve the approveResult
  onApprove: TApproveCallback | string;

  onStart?: TEventCallback;
  onCreate?: TEventCallback;
  onComplete?: TEventCallback;
  onTimeout?: TEventCallback;
  onCancel?: TEventCallback;
  onReject?: TEventCallback;
  onError?: TEventCallback;

  sessionId?: string;
  relayUrl?: string;
  timeout?: typeof SessionTimeout;
  strategy?: string;

  autoConnect?: boolean;
  saveConnect?: boolean;
  onlyConnect?: boolean;
};
export type THookResult = {
  sessionId: string;
  dispatch: (...args: any[]) => any;
  generate: (...args: any[]) => any;
  cancel: (...args: any[]) => any;
  session: {
    context: TSession;
    status: TSessionStatus;
    deepLink: string;
    existing: boolean;
  };
};
export type TBasicPropsBase = {
  locale?: TLocaleCode;
  webWalletUrl?: string;
  extraContent?: any;
  qrcodeSize?: number;
  loadingEle?: any;
  enabledConnectTypes?: TWalletCode[];
  messages: TConnectMessage;
};
export type TConnectProps = THookProps & TBasicPropsBase;
export type TBasicProps = TBasicPropsBase & Pick<THookResult, 'session' | 'generate' | 'cancel'>;
export type TDialogProps = TConnectProps & {
  onClose?: (...args: any[]) => any;
  // - 新版本 (did-connect) 中 popup+open 的思路是: 导出 withDialog(Auth), 让 Auth 具有在弹出窗中显示的能力, 但是否在 Dialog 中显示取决于 popup prop 是否为 true,
  //   如果为 popup 为 true, 可以直接将 Auth 渲染到 DOM 中 (不需要外部控制), 外部通过传入 open state & onClose 来控制 Auth 的显示/隐藏 (或者说启用/关闭)
  // 是否弹出显示, true 表示在 Dialog 中渲染, 并可以通过 open/onClose 控制 dialog 的显示/隐藏, false 表示直接渲染原内容
  popup?: boolean;
  open?: boolean;
  dialogStyle?: React.CSSProperties;
  disableClose?: boolean;
};

// session related
export type TSessionUser = {
  did: string;
  role: string;
  fullName?: string;
  avatar?: string;
  email?: string;
  passports?: {
    name: string;
    title: string;
  }[];
};

// storage related
export type TStorageEngineCode = LiteralUnion<'ls' | 'cookie', string>;
export interface TStorageEngine {
  getToken(): string | undefined | null;
  setToken(token: string): void;
  removeToken(): void;
  engine?: TStorageEngineCode;
  key?: string;
}

// avatar related
export type TAvatarVariant = LiteralUnion<'default' | 'rounded' | 'circle', string>;
export type TAvatarShape = LiteralUnion<'' | 'rectangle' | 'square' | 'hexagon' | 'circle', string>;
