// Generate by [js2dts@0.3.3](https://github.com/whxaxes/js2dts#readme)

import * as events from 'events';
/**
 * Defines the interface of DID-Auth Token Storage
 * Which is used to persist state during the DID-Auth process in a dApp
 *
 * @class SessionStorage
 * @see @did-connect/relay-storage-firebase
 * @see @did-connect/relay-storage-mongo
 * @see @did-connect/relay-storage-keystone
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
declare class MongoSessionStorage extends SessionStorage {
  collectionName: string;
  options: _Lib.T100;
  /**
   * Creates an instance of MongoSessionStorage.
   *
   * @class
   * @param {Object} options { collection, url }
   * @param {string} options.url - mongodb connection string
   * @param {string} [options.collection='did_auth_tokens'] - which collection to store did auth tokens
   */
  constructor(options: _Lib.T100);
  connectionFailed(err: any): void;
  handleNewConnectionAsync(client: any): void;
  changeState(newState: any): void;
  setCollection(collection: any): this;
  collectionReady(): any;
  read(token: any): any;
  create(token: any, status?: string): any;
  update(token: any, updates: any, upsert?: boolean): any;
  delete(token: any): any;
  exist(token: any, did: any): any;
  clear(): any;
  close(): void;
}
declare const _Lib: typeof MongoSessionStorage;
declare namespace _Lib {
  export interface T100 {
    url: string;
    collection?: string;
  }
}
export = _Lib;
