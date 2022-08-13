/* eslint-disable @typescript-eslint/indent */
// FIXME: convert union types to literal-union with type-fest

export interface TAgreementRequest {
  chainInfo?: TChainInfo;
  description: string;
  digest: string;
  meta?: any;
  method?: 'keccak' | 'sha3' | 'keccak_384' | 'sha3_384' | 'keccak_512' | 'sha3_512' | 'sha2';
  type: 'agreement';
  uri: string;
}

export interface TAgreementResponse {
  agreed: boolean;
  meta?: any;
  sig?: string;
  type: 'agreement';
}

export type TAnyRequest =
  | TAgreementRequest
  | TAssetRequest
  | TAuthPrincipalRequest
  | TPrepareTxRequest
  | TProfileRequest
  | TSignatureRequest
  | TVerifiableCredentialRequest;

export type TAnyResponse =
  | TAgreementResponse
  | TAssetResponse
  | TAuthPrincipalResponse
  | TPrepareTxResponse
  | TProfileResponse
  | TSignatureResponse
  | TVerifiableCredentialResponse;

export interface TAppInfo {
  description: string;
  icon: string;
  link: string;
  name: string;
  nodeDid?: string;
  path?: string;
  publisher?: string;
  subscriptionEndpoint?: string;
  updateSubEndpoint?: boolean;
}

export interface TAssetRequest {
  address?: string;
  chainInfo?: TChainInfo;
  description: string;
  filters?: {
    address?: string;
    tag?: string;
    trustedIssuers?: (
      | {
          did: string;
          endpoint: string;
        }
      | string
    )[];
    trustedParents?: string[];
  }[];
  meta?: any;
  optional?: boolean;
  tag?: string;
  trustedIssuers?: (
    | {
        did: string;
        endpoint: string;
      }
    | string
  )[];
  trustedParents?: string[];
  type: 'asset';
}

export interface TAssetResponse {
  asset: string;
  meta?: any;
  ownerDid: string;
  ownerPk: string;
  ownerProof: string;
  type: 'asset';
}

export interface TAuthPrincipalRequest {
  chainInfo?: TChainInfo;
  declareParams?: {
    issuer: string;
    moniker: string;
  };
  description: string;
  meta?: any;
  supervised?: boolean;
  target?: string;
  targetType?: {
    hash: 'keccak' | 'sha3' | 'keccak_384' | 'sha3_384' | 'keccak_512' | 'sha3_512' | 'sha2';
    key: 'ed25519' | 'secp256k1' | 'ethereum';
    role:
      | 'account'
      | 'node'
      | 'device'
      | 'application'
      | 'contract'
      | 'bot'
      | 'asset'
      | 'stake'
      | 'validator'
      | 'group'
      | 'tx'
      | 'tether'
      | 'swap'
      | 'delegation'
      | 'vc'
      | 'blocklet'
      | 'store'
      | 'token'
      | 'factory'
      | 'rollup'
      | 'storage'
      | 'any';
  };
  type: 'authPrincipal';
}

export interface TAuthPrincipalResponse {
  meta?: any;
  type: 'authPrincipal';
  userDid: string;
  userPk: string;
}

export interface TChainInfo {
  host?: string | 'none';
  id?: string;
}

export interface TContext {
  body: object;
  didwallet: TWalletInfo;
  headers: object;
  locale: string;
  previousConnected?: {
    didwallet: 'ios' | 'android' | 'web' | '';
    userDid: string;
    userPk: string;
  } | null;
  session: TSession | null;
  sessionId: string;
  signerPk: string;
  signerToken: string;
}

export interface TPrepareTxRequest {
  chainInfo?: TChainInfo;
  description: string;
  display?: string;
  meta?: any;
  partialTx: string;
  requirement: {
    assets?: {
      address?: string[];
      issuer?: string[];
      parent?: string[];
    };
    tokens: {
      address: string;
      value: string;
    }[];
  };
  type: 'prepareTx';
}

export interface TPrepareTxResponse {
  finalTx: string;
  meta?: any;
  type: 'prepareTx';
}

export interface TProfileRequest {
  chainInfo?: TChainInfo;
  description: string;
  items?: ('fullName' | 'email' | 'phone' | 'signature' | 'avatar' | 'birthday')[];
  meta?: any;
  type: 'profile';
}

export interface TProfileResponse {
  avatar?: string;
  birthday?: string;
  email?: string;
  fullName?: string;
  meta?: any;
  phone?: string;
  signature?: string;
  type: 'profile';
}

export interface TSession {
  appInfo: TAppInfo;
  approveResults: any[];
  approveUrl?: string;
  authUrl: string;
  autoConnect: boolean;
  challenge: string;
  connectUrl?: string;
  currentConnected?: {
    didwallet: TWalletInfo;
    userDid: string;
    userPk: string;
  } | null;
  currentStep: number;
  error?: string;
  onlyConnect: boolean;
  previousConnected?: {
    didwallet: 'ios' | 'android' | 'web' | '';
    userDid: string;
    userPk: string;
  } | null;
  requestedClaims: TAnyRequest[][];
  responseClaims: TAnyResponse[][];
  sessionId: string;
  status:
    | 'created'
    | 'walletScanned'
    | 'walletConnected'
    | 'appConnected'
    | 'walletApproved'
    | 'appApproved'
    | 'error'
    | 'timeout'
    | 'rejected'
    | 'canceled'
    | 'completed';
  strategy: string | 'default' | 'smart';
  timeout: {
    app: number;
    relay: number;
    wallet: number;
  };
  updaterPk: string;
}

export interface TSignatureRequest {
  chainInfo?: TChainInfo;
  description: string;
  digest?: string;
  display?: string;
  meta?: any;
  method?: 'none' | 'keccak' | 'sha3' | 'keccak_384' | 'sha3_384' | 'keccak_512' | 'sha3_512' | 'sha2';
  origin?: string;
  type: 'signature';
  typeUrl: 'fg:t:transaction' | 'mime:text/plain' | 'mime:text/html' | 'eth:transaction';
}

export interface TSignatureResponse {
  meta?: any;
  sig: string;
  type: 'signature';
}

export interface TVerifiableCredentialRequest {
  chainInfo?: TChainInfo;
  description: string;
  filters?: {
    tag?: string;
    target?: string;
    trustedIssuers?: (
      | {
          did: string;
          endpoint: string;
        }
      | string
    )[];
    type?: string[];
  }[];
  item?: string[];
  meta?: any;
  optional?: boolean;
  tag?: string;
  target?: string;
  trustedIssuers?: (
    | {
        did: string;
        endpoint: string;
      }
    | string
  )[];
  type: 'verifiableCredential';
}

export interface TVerifiableCredentialResponse {
  assetDid?: string;
  meta?: any;
  optional?: boolean;
  presentation?: string;
  type: 'verifiableCredential';
}

export interface TWalletInfo {
  jwt: string;
  os: 'ios' | 'android' | 'web' | '';
  version: string;
}
