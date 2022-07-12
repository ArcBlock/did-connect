/* eslint-disable no-underscore-dangle */
// @ts-ignore
import NeDB from '@nedb/core';
// @ts-ignore
import NedbMulti from '@nedb/multi';
import { BaseStorage, SessionStorageOptions, SessionStorage } from '@did-connect/storage';
import { TSession } from '@did-connect/types';

export type NedbStorageOptions = SessionStorageOptions & {
  dbPath: string;
  dbPort?: number;
};

const debug = require('debug')(require('../package.json').name);

type Callback = (...args: any[]) => void;

export interface NedbInstance {
  loadDatabase(cb: Callback): Promise<void>;
  closeDatabase(cb: Callback): Promise<void>;

  findOne(conditions: any, cb: Callback): Promise<any>;

  update(query: any, update: any, cb: Callback): Promise<any>;
  update(query: any, update: any, options: any, cb: Callback): Promise<any>;

  insert(doc: any, cb: Callback): Promise<any>;
  insert(doc: any, options: any, cb: Callback): Promise<any>;

  remove(conditions: any, cb: Callback): Promise<any>;
  remove(conditions: any, options: any, cb: Callback): Promise<any>;
}

export class NedbStorage extends BaseStorage implements SessionStorage {
  readonly db: NedbInstance;

  constructor(options: NedbStorageOptions) {
    super(options);

    if (!options.dbPath) {
      throw new Error('DiskSessionStorage requires a valid dbPath option to initialize');
    }

    const DataStore = options.dbPort ? NedbMulti(options.dbPort) : NeDB;

    this.db = new DataStore(
      Object.assign(
        {
          filename: options.dbPath,
          autoload: true,
          timestampData: true,
        },
        options
      )
    );

    this.db.loadDatabase((err) => {
      if (err) {
        debug(`failed to load disk database ${options.dbPath}`, { error: err });
      }
    });

    // TODO: we may need a ready state if the database file is too large
  }

  read(sessionId: string): Promise<TSession> {
    return new Promise((resolve, reject) => {
      this.db.findOne({ sessionId }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
    });
  }

  create(sessionId: string, attributes: Partial<TSession>): Promise<TSession> {
    return new Promise((resolve, reject) => {
      this.db.insert({ sessionId, ...attributes }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          this.emit('create', doc);
          debug('emit.create', { sessionId, ...attributes });
          resolve(doc);
        }
      });
    });
  }

  update(sessionId: string, updates: Partial<TSession>): Promise<TSession> {
    return new Promise((resolve, reject) => {
      this.db.update(
        { sessionId },
        { $set: updates },
        { multi: false, upsert: false, returnUpdatedDocs: true },
        (err, numAffected, doc) => {
          if (err) {
            reject(err);
          } else {
            this.emit('update', doc);
            debug('emit.update', { sessionId, updates });
            if (updates.status && this.isFinalized(updates.status)) {
              this.deleteFinalized(sessionId).catch(console.error);
            }
            resolve(doc);
          }
        }
      );
    });
  }

  delete(sessionId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!sessionId) {
        reject(new Error('sessionId is required to delete auth record'));
        return;
      }
      this.db.remove({ sessionId }, { multi: true }, (err, numRemoved: number) => {
        if (err) {
          reject(err);
        } else {
          this.emit('delete', sessionId);
          resolve(numRemoved);
        }
      });
    });
  }

  clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve(numRemoved);
        }
      });
    });
  }
}
