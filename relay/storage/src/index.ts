/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventEmitter } from 'events';
import { SessionType } from '@did-connect/types';

export type SessionStorageOptions = {
  ttl?: number;
};

/**
 * Defines the interface of DID Connect Session Storage
 * Which is used to persist state during the DID Connect process between dApp and wallet
 *
 * @class SessionStorage
 * @see @did-connect/storage-memory
 * @see @did-connect/storage-mongo
 * @see @did-connect/storage-nedb
 * @extends {EventEmitter}
 */
export default class SessionStorage extends EventEmitter {
  options: SessionStorageOptions;

  constructor(options: SessionStorageOptions = {}) {
    super();
    this.options = options || {};
  }

  create(sessionId: string, attributes: Partial<SessionType>): Promise<SessionType> {
    throw new Error('SessionStorage.create must be implemented in child class');
  }

  read(sessionId: string): Promise<SessionType> {
    throw new Error('SessionStorage.read must be implemented in child class');
  }

  update(sessionId: string, updates: Partial<SessionType>): Promise<SessionType> {
    throw new Error('SessionStorage.update must be implemented in child class');
  }

  delete(sessionId: string): Promise<void> {
    throw new Error('SessionStorage.delete must be implemented in child class');
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
