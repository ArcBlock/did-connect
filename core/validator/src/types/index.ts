/* eslint-disable @typescript-eslint/indent */

export interface AgreementRequestType {
  chainInfo?: ChainInfoType;
  description: string;
  digest: string;
  meta?: any;
  method?: 'keccak' | 'sha3' | 'keccak_384' | 'sha3_384' | 'keccak_512' | 'sha3_512' | 'sha2';
  type: 'agreement';
  uri: string;
}

export interface AgreementResponseType {
  chainInfo?: ChainInfoType;
  description: string;
  digest: string;
  meta?: any;
  method?: 'keccak' | 'sha3' | 'keccak_384' | 'sha3_384' | 'keccak_512' | 'sha3_512' | 'sha2';
  type: 'agreement';
  uri: string;
}

export type AnyRequestType =
  | AuthPrincipalRequestType
  | ProfileRequestType
  | SignatureRequestType
  | PrepareTxRequestType
  | AgreementRequestType
  | VerifiableCredentialRequestType
  | AssetRequestType;

export type AnyResponseType =
  | AuthPrincipalResponseType
  | ProfileResponseType
  | SignatureResponseType
  | PrepareTxResponseType
  | AgreementResponseType
  | VerifiableCredentialResponseType
  | AssetResponseType;

export interface AppInfoType {
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

export interface AssetRequestType {
  address?: string;
  chainInfo?: ChainInfoType;
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

export interface AssetResponseType {
  address?: string;
  chainInfo?: ChainInfoType;
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

export interface AuthPrincipalRequestType {
  chainInfo?: ChainInfoType;
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

export interface AuthPrincipalResponseType {
  chainInfo?: ChainInfoType;
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

export interface ChainInfoType {
  host: 'none';
  id?: string;
}

export interface ContextType {
  body?: object;
  didwallet?: object;
  headers: object;
  locale: string;
  previousConnected?: object | null;
  session?: SessionType | null;
  sessionId?: string;
  signerPk?: string;
  signerToken?: string;
}

export interface PrepareTxRequestType {
  chainInfo?: ChainInfoType;
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

export interface PrepareTxResponseType {
  chainInfo?: ChainInfoType;
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

export interface ProfileRequestType {
  chainInfo?: ChainInfoType;
  description: string;
  items?: ('fullName' | 'email' | 'phone' | 'signature' | 'avatar' | 'birthday')[];
  meta?: any;
  type: 'profile';
}

export interface ProfileResponseType {
  chainInfo?: ChainInfoType;
  description: string;
  items?: ('fullName' | 'email' | 'phone' | 'signature' | 'avatar' | 'birthday')[];
  meta?: any;
  type: 'profile';
}

export type RequestListType = (AnyRequestType[] | AnyRequestType)[];

export type ResponseListType = (AnyResponseType[] | AnyResponseType)[];

export interface SessionType {
  appInfo?: AppInfoType;
  approveResults?: any[];
  authUrl: string;
  autoConnect?: boolean;
  challenge: string;
  currentConnected?: {
    didwallet: {
      jwt: string;
      os: string;
      version: string;
    };
    userDid: string;
    userPk: string;
  } | null;
  currentStep?: number;
  error?: string;
  onlyConnect?: boolean;
  previousConnected?: {
    didwallet: string;
    userDid: string;
    userPk: string;
  } | null;
  requestedClaims?: RequestListType;
  responseClaims?: ResponseListType;
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
  strategy?: string | 'default';
  timeout?: {
    app?: number;
    relay?: number;
    wallet?: number;
  };
  updaterPk: string;
}

export interface SignatureRequestType {
  chainInfo?: ChainInfoType;
  description: string;
  digest?: string;
  display?: string;
  meta?: any;
  method?: 'none' | 'keccak' | 'sha3' | 'keccak_384' | 'sha3_384' | 'keccak_512' | 'sha3_512' | 'sha2';
  origin?: string;
  type: 'signature';
  typeUrl: 'fg:t:transaction' | 'mime:text/plain' | 'mime:text/html' | 'eth:transaction';
}

export interface SignatureResponseType {
  chainInfo?: ChainInfoType;
  description: string;
  digest?: string;
  display?: string;
  meta?: any;
  method?: 'none' | 'keccak' | 'sha3' | 'keccak_384' | 'sha3_384' | 'keccak_512' | 'sha3_512' | 'sha2';
  origin?: string;
  type: 'signature';
  typeUrl: 'fg:t:transaction' | 'mime:text/plain' | 'mime:text/html' | 'eth:transaction';
}

export interface VerifiableCredentialRequestType {
  chainInfo?: ChainInfoType;
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

export interface VerifiableCredentialResponseType {
  chainInfo?: ChainInfoType;
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
