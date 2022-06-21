/* eslint-disable @typescript-eslint/indent */
import { LiteralUnion } from 'type-fest';
import { TAppInfo, TChainInfo, TRequestList } from './types';

export * from './schemas';
export * from './types';

export type TI18nMessages = {
  [key: string]: {
    [key: string]: string;
  };
};

export type TAnyObject = {
  [key: string]: any;
};

// Types for onApprove callback
export type TAppResponse = Partial<{
  response: any;
  error: string;
  errorMessage: string;
  successMessage: string;
  nextWorkflow: string;
  [key: string]: any;
}>;

// Types for authenticator internal
export type TAuthResponse = Partial<
  TAppResponse & {
    status: LiteralUnion<['ok', 'error'], string>;
    action: LiteralUnion<['responseAuth'], string>;
    challenge: string;
    appInfo: TAppInfo;
    chainInfo: TChainInfo;
    requestedClaims: TRequestList;
    url: string;
  }
>;

export class CustomError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    // @ts-ignore
    if (typeof Error.captureStackTrace === 'function') {
      // @ts-ignore
      Error.captureStackTrace(this, CustomError);
    }
    this.code = code;
  }
}

export const SessionTimeout = {
  app: 10 * 1000,
  relay: 10 * 1000,
  wallet: 60 * 1000,
} as const;
