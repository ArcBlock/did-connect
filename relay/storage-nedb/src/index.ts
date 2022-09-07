/* eslint-disable no-underscore-dangle */
import { DataStore, DataStoreOptions } from '@nedb/core';
import { createDataStore } from '@nedb/multi';
import { BaseStorage, SessionStorageOptions, SessionStorage } from '@did-connect/storage';
import { TSession } from '@did-connect/types';

export type NedbStorageOptions = SessionStorageOptions & DataStoreOptions & { dbPath: string; dbPort?: number };

const debug = require('debug')(require('../package.json').name);

export class NedbStorage extends BaseStorage implements SessionStorage {
  readonly db: typeof DataStore;

  constructor(options: NedbStorageOptions) {
    super(options);

    if (!options.dbPath) {
      throw new Error('DiskSessionStorage requires a valid dbPath option to initialize');
    }

    const DB = options.dbPort ? createDataStore(options.dbPort) : DataStore;

    // @ts-ignore
    this.db = new DB<TSession>(
      Object.assign(
        {
          filename: options.dbPath,
          autoload: true,
          timestampData: true,
        },
        options
      )
    );

    // @ts-ignore
    this.db.loadDatabase((err: any) => {
      if (err) {
        debug(`failed to load disk database ${options.dbPath}`, { error: err });
      }
    });

    // TODO: we may need a ready state if the database file is too large
  }

  read(sessionId: string): Promise<TSession> {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      this.db.findOne({ sessionId }, (err: any, doc: TSession) => {
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
      // @ts-ignore
      this.db.insert({ sessionId, ...attributes }, (err: any, doc: TSession) => {
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
      // @ts-ignore
      this.db.update(
        { sessionId },
        { $set: updates },
        { multi: false, upsert: false, returnUpdatedDocs: true },
        // @ts-ignore
        (err: any, [, doc]) => {
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
      // @ts-ignore
      this.db.remove({ sessionId }, { multi: true }, (err: any, numRemoved: number) => {
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
      // @ts-ignore
      this.db.remove({}, { multi: true }, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
