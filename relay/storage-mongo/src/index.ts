/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-param-reassign */
// @ts-ignore
import MongoClient from 'mongodb';
import { BaseStorage, SessionStorage, SessionStorageOptions } from '@did-connect/storage';
import { TSession } from '@did-connect/types';

const debug = require('debug')(require('../package.json').name);

export type MongoStorageOptions = SessionStorageOptions & {
  url: string;
  collection?: string;
  [key: string]: any;
};

export class MongoStorage extends BaseStorage implements SessionStorage {
  // @ts-ignore
  state: string;

  collectionName: string;

  client: any;

  db: any;

  collectionReadyPromise: any;

  collection: any;

  /**
   * Creates an instance of MongoSessionStorage.
   *
   * @class
   * @param {Object} options { collection, url }
   * @param {string} options.url - mongodb connection string
   * @param {string} [options.collection='did_auth_tokens'] - which collection to store did auth tokens
   */
  constructor(options: MongoStorageOptions) {
    options = options || {};

    super(options);

    this.collectionName = options.collection || 'did_auth_tokens';

    this.changeState('init');

    const newConnectionCallback = (err: any, client: any) => {
      if (err) {
        this.connectionFailed(err);
      } else {
        this.handleNewConnectionAsync(client);
      }
    };

    if (options.url) {
      // New native connection using url + mongoOptions
      const _options = options.mongoOptions || {};
      if (typeof _options.useNewUrlParser !== 'boolean') {
        _options.useNewUrlParser = true;
      }
      MongoClient.connect(options.url, _options, newConnectionCallback);
    } else if (options.mongooseConnection) {
      // Re-use existing or upcoming mongoose connection
      if (options.mongooseConnection.readyState === 1) {
        this.handleNewConnectionAsync(options.mongooseConnection);
      } else {
        options.mongooseConnection.once(
          'open',
          () => this.handleNewConnectionAsync(options.mongooseConnection)
          // eslint-disable-next-line function-paren-newline
        );
      }
    } else if (options.client) {
      this.handleNewConnectionAsync(options.client);
    } else if (options.clientPromise) {
      options.clientPromise
        .then((client: any) => this.handleNewConnectionAsync(client))
        .catch((err: any) => this.connectionFailed(err));
    } else {
      throw new Error('Connection strategy not found');
    }

    this.changeState('connecting');
  }

  connectionFailed(err: any) {
    this.changeState('disconnected');
    throw err;
  }

  handleNewConnectionAsync(client: any) {
    this.client = client;
    this.db = typeof client.db !== 'function' ? client.db : client.db();
    this.setCollection(this.db.collection(this.collectionName));
    this.changeState('connected');
  }

  changeState(newState: string) {
    if (newState !== this.state) {
      this.state = newState;
      this.emit(newState);
    }
  }

  setCollection(collection: any) {
    this.collectionReadyPromise = undefined;
    this.collection = collection;

    return this;
  }

  collectionReady() {
    let promise = this.collectionReadyPromise;
    if (!promise) {
      promise = new Promise((resolve, reject) => {
        if (this.state === 'connected') {
          return resolve(this.collection);
        }
        if (this.state === 'connecting') {
          return this.once('connected', () => resolve(this.collection));
        }
        return reject(new Error('Not connected'));
      });
      this.collectionReadyPromise = promise;
    }
    return promise;
  }

  async read(sessionId: string): Promise<TSession> {
    return this.collectionReady().then((collection: any) => collection.findOne({ sessionId }));
  }

  async create(sessionId: string, attrs: Partial<TSession>): Promise<TSession> {
    return this.update(sessionId, { ...attrs }, true);
  }

  async update(sessionId: string, updates: Partial<TSession>, upsert = false): Promise<TSession> {
    // @ts-ignore
    if (!updates.updatedAt) {
      // @ts-ignore
      updates.updatedAt = new Date();
    }

    debug('update', { sessionId, updates });

    return this.collectionReady()
      .then((collection: any) => collection.updateOne({ sessionId }, { $set: updates }, { upsert }))
      .then((rawResponse: any) => {
        if (rawResponse.result) {
          rawResponse = rawResponse.result;
        }
        const data = Object.assign({ sessionId }, updates);

        if (rawResponse && rawResponse.upserted) {
          this.emit('create', data);
          debug('emit.create', { sessionId, updates });
        } else {
          this.emit('update', data);
          debug('emit.update', { sessionId, updates });
          if (updates.status && this.isFinalized(updates.status)) {
            this.deleteFinalized(sessionId).catch(console.error);
          }
        }

        return data;
      });
  }

  async delete(sessionId: string): Promise<number> {
    return this.collectionReady()
      .then((collection: any) => collection.deleteOne({ sessionId }))
      .then(() => this.emit('delete', sessionId));
  }

  async clear(): Promise<void> {
    return this.collectionReady().then((collection: any) => collection.drop());
  }

  close() {
    if (this.client) {
      this.client.close();
    }
  }
}
