// Generate by [js2dts@0.3.3](https://github.com/whxaxes/js2dts#readme)

import * as events from 'events';
/**
 * Defines the interface of DID-Auth Token Storage
 * Which is used to persist state during the DID-Auth process in a dApp
 *
 * @class SessionStorage
 * @see @did-connect/storage-firebase
 * @see @did-connect/storage-mongo
 * @see @did-connect/storage-keystone
 * @extends {EventEmitter}
 */
declare class SessionStorage extends events {
  /**
   * Creates an instance of SessionStorage.
   *
   * @class
   * @param {object} options
   */
  constructor(options: any);
  create(token: any, status?: string): void;
  read(token: any): void;
  update(token: any, updates: any): void;
  delete(token: any): void;
  exist(token: any, did: any): void;
}
declare class MemorySessionStorage extends SessionStorage {
  read(token: any): any;
  create(token: any, status?: string): any;
  update(token: any, updates: any): any;
  delete(token: any): void;
  exist(token: any, did: any): boolean;
  clear(): void;
}
declare const _Lib: typeof MemorySessionStorage;
export = _Lib;
