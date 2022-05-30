export const SESSION_SYMBOL = Symbol('session');

export const STATUS = Object.freeze({
  CREATED: 'created',
  SCANNED: 'scanned',
  SUCCEED: 'succeed',
});

export const TOKEN_KEY = 'login_token';
export const CONNECTED_PK_KEY = 'connected_pk';
export const CONNECTED_DID_KEY = 'connected_did';
export const CONNECTED_APP_KEY = 'connected_app';
export const CONNECTED_WALLET_OS_KEY = 'connected_wallet_os';

export const AUTH_SERVICE_PREFIX = '/.well-known/service';
export const PREFIX = '/api/did';
