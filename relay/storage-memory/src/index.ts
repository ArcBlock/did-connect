import { BaseStorage, SessionStorage } from '@did-connect/storage';
import { TSession } from '@did-connect/types';

interface StorageObject {
  [key: string]: TSession;
}

let storage: StorageObject = {};

export class MemoryStorage extends BaseStorage implements SessionStorage {
  read(sessionId: string): Promise<TSession> {
    return Promise.resolve(storage[sessionId]);
  }

  create(sessionId: string, attributes: Partial<TSession>): Promise<TSession> {
    // @ts-ignore
    storage[sessionId] = { sessionId, ...attributes };
    this.emit('create', storage[sessionId]);
    return this.read(sessionId);
  }

  update(sessionId: string, updates: Partial<TSession>): Promise<TSession> {
    delete updates.sessionId;
    storage[sessionId] = Object.assign(storage[sessionId], updates);
    this.emit('update', storage[sessionId]);
    if (updates.status && this.isFinalized(updates.status)) {
      this.deleteFinalized(sessionId);
    }

    return this.read(sessionId);
  }

  delete(sessionId: string): Promise<number> {
    this.emit('delete', storage[sessionId]);
    if (storage[sessionId]) {
      delete storage[sessionId];
      return Promise.resolve(1);
    }

    return Promise.resolve(0);
  }

  // @ts-ignore
  clear(): Promise<void> {
    storage = {};
  }
}
