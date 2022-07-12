/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventEmitter } from 'events';
import { TSession } from '@did-connect/types';

export type SessionStorageOptions = {
  ttl?: number;
};

export interface SessionStorage {
  create(sessionId: string, attributes: Partial<TSession>): Promise<TSession>;
  read(sessionId: string): Promise<TSession>;
  update(sessionId: string, updates: Partial<TSession>): Promise<TSession>;
  delete(sessionId: string): Promise<number>;
  clear(): Promise<void>;
  isFinalized(status: string): boolean;
  deleteFinalized(sessionId: string): Promise<boolean>;
}

/**
 * Defines the interface of DID Connect Session Storage
 * Which is used to persist state during the DID Connect process between dApp and wallet
 *
 * @class BaseStorage
 * @see @did-connect/storage-memory
 * @see @did-connect/storage-mongo
 * @see @did-connect/storage-nedb
 * @extends {EventEmitter}
 */
export class BaseStorage extends EventEmitter implements SessionStorage {
  readonly options: SessionStorageOptions;

  constructor(options: SessionStorageOptions = {}) {
    super();
    this.options = options || {};
  }

  create(sessionId: string, attributes: Partial<TSession>): Promise<TSession> {
    throw new Error('create must be implemented in child class');
  }

  read(sessionId: string): Promise<TSession> {
    throw new Error('read must be implemented in child class');
  }

  update(sessionId: string, updates: Partial<TSession>): Promise<TSession> {
    throw new Error('update must be implemented in child class');
  }

  delete(sessionId: string): Promise<number> {
    throw new Error('delete must be implemented in child class');
  }

  clear(): Promise<void> {
    throw new Error('clear must be implemented in child class');
  }

  isFinalized(status: string): boolean {
    return ['error', 'timeout', 'canceled', 'rejected', 'completed'].includes(status);
  }

  deleteFinalized(sessionId: string): Promise<boolean> {
    const { ttl = 8 * 1000 } = this.options;
    return new Promise((resolve) => {
      setTimeout(async () => {
        if (process.env.NODE_ENV !== 'test') {
          // eslint-disable-next-line no-console
          console.info('delete finalized session', sessionId);
        }
        try {
          await this.delete(sessionId);
          resolve(true);
        } catch {
          resolve(false);
        }
      }, ttl);
    });
  }
}
