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
 * @see @did-connect/storage-firebase
 * @see @did-connect/storage-mongo
 * @see @did-connect/storage-keystone
 * @extends {EventEmitter}
 */
export default class SessionStorage extends EventEmitter {
  options: SessionStorageOptions;

  /**
   * Creates an instance of SessionStorage.
   *
   * @class
   * @param {object} options
   */
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

  delete(sessionId: string): void {
    throw new Error('SessionStorage.delete must be implemented in child class');
  }

  isFinalized(status: string) {
    return ['error', 'timeout', 'canceled', 'rejected', 'completed'].includes(status);
  }

  deleteFinalized(sessionId: string) {
    const { ttl = 8 * 1000 } = this.options;
    return new Promise((resolve) => {
      setTimeout(() => {
        if (process.env.NODE_ENV !== 'test') {
          // eslint-disable-next-line no-console
          console.info('delete finalized session', sessionId);
        }
        resolve(this.delete(sessionId));
      }, ttl);
    });
  }
}
