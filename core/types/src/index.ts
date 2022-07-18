/* eslint-disable @typescript-eslint/indent */
import { Joi } from '@arcblock/validator';
import { LiteralUnion } from 'type-fest';
import { TAppInfo, TChainInfo, TWalletInfo, TSession, TContext, TAnyResponse, TAnyRequest } from './types';
import {
  AuthPrincipalRequest,
  AssetRequest,
  ProfileRequest,
  SignatureRequest,
  VerifiableCredentialRequest,
  AgreementRequest,
  PrepareTxRequest,
} from './schemas';

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
export type TAuthResponse = TAppResponse & {
  status: LiteralUnion<'ok' | 'error', string>;
  action: LiteralUnion<'responseAuth' | 'declineAuth', string>;
  challenge: string;
  appInfo: TAppInfo;
  chainInfo?: TChainInfo;
  requestedClaims: TAnyRequest[];
  url: string;
};

export type TAuthContext = TContext & {
  baseUrl?: string;
  request: TAnyObject;
};

export interface TEvent extends Omit<TSession, 'responseClaims'> {
  type: string;
  data: any;
  responseClaims: TAnyResponse[];
  didwallet?: TWalletInfo;
  source?: string;
}

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

const urlSchema = Joi.string().uri({ scheme: ['http', 'https'] }).required(); // prettier-ignore
export function isUrl(str: any): boolean {
  if (typeof str !== 'string') {
    return false;
  }
  return !urlSchema.validate(str).error;
}

export function isRequestList(claims: TAnyRequest[][]): { code: string; error: string } {
  const validators: TAnyObject = {
    agreement: AgreementRequest,
    asset: AssetRequest,
    authPrincipal: AuthPrincipalRequest,
    prepareTx: PrepareTxRequest,
    profile: ProfileRequest,
    signature: SignatureRequest,
    verifiableCredential: VerifiableCredentialRequest,
  };

  for (const group of claims) {
    if (!Array.isArray(group)) {
      return {
        error: 'Invalid request group: each group must be an array',
        code: 'REQUEST_INVALID',
      };
    }
    for (const claim of group) {
      if (!validators[claim.type]) {
        return {
          error: `Invalid ${claim.type} request: supported request types are ${Object.keys(validators)}`,
          code: 'REQUEST_UNSUPPORTED',
        };
      }
      const { error } = validators[claim.type].validate(claim);
      if (error) {
        return {
          error: `Invalid ${claim.type} request: ${error.details.map((x: any) => x.message).join(', ')}`,
          code: 'REQUEST_INVALID',
        };
      }
    }
  }

  return { error: '', code: 'OK' };
}

export function t(template: string, data: TAnyObject) {
  // eslint-disable-next-line no-prototype-builtins
  return template.replace(/{(\w*)}/g, (_, key: string) => (data.hasOwnProperty(key) ? data[key] : ''));
}
