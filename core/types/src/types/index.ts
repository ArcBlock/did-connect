/* eslint-disable @typescript-eslint/indent */

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
  chainInfo?: TChainInfo;
  description: string;
  digest: string;
  meta?: any;
  method?: 'keccak' | 'sha3' | 'keccak_384' | 'sha3_384' | 'keccak_512' | 'sha3_512' | 'sha2';
  sig?: string;
  type: 'agreement';
  uri: string;
}

export type TAnyRequest =
  | TAuthPrincipalRequest
  | TProfileRequest
  | TSignatureRequest
  | TPrepareTxRequest
  | TAgreementRequest
  | TVerifiableCredentialRequest
  | TAssetRequest;

export type TAnyResponse =
  | TAuthPrincipalResponse
  | TProfileResponse
  | TSignatureResponse
  | TPrepareTxResponse
  | TAgreementResponse
  | TVerifiableCredentialResponse
  | TAssetResponse;

export interface TAppInfo {
  description: string;
  icon: string;
  link?: string;
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
  address?: string;
  asset: string;
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
  ownerDid: string;
  ownerPk: string;
  ownerProof: string;
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
      | 'registry'
      | 'token'
      | 'factory'
      | 'rollup'
      | 'any';
  };
  type: 'authPrincipal';
}

export interface TAuthPrincipalResponse {
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
      | 'registry'
      | 'token'
      | 'factory'
      | 'rollup'
      | 'any';
  };
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
  didwallet: TDidWalletInfo;
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

export interface TDidWalletInfo {
  jwt: string;
  os: 'ios' | 'android' | 'web' | '';
  version: string;
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
  chainInfo?: TChainInfo;
  description: string;
  display?: string;
  finalTx: string;
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
  chainInfo?: TChainInfo;
  description: string;
  email?: string;
  fullName?: string;
  items?: ('fullName' | 'email' | 'phone' | 'signature' | 'avatar' | 'birthday')[];
  meta?: any;
  phone?: string;
  signature?: string;
  type: 'profile';
}

export type TRequestList = TAnyRequest[];

export type TResponseList = TAnyResponse[];

export interface TSession {
  appInfo: TAppInfo;
  approveResults: any[];
  authUrl: string;
  autoConnect: boolean;
  challenge: string;
  currentConnected?: {
    didwallet: TDidWalletInfo;
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
  requestedClaims: (TAnyRequest[] | TAnyRequest)[];
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
  strategy: string | 'default';
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
  chainInfo?: TChainInfo;
  description: string;
  digest?: string;
  display?: string;
  meta?: any;
  method?: 'none' | 'keccak' | 'sha3' | 'keccak_384' | 'sha3_384' | 'keccak_512' | 'sha3_512' | 'sha2';
  origin?: string;
  sig: string;
  type: 'signature';
  typeUrl: 'fg:t:transaction' | 'mime:text/plain' | 'mime:text/html' | 'eth:transaction';
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
  presentation: string;
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
