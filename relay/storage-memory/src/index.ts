import { BaseStorage, SessionStorage } from '@did-connect/storage';
import { SessionType } from '@did-connect/types';

interface StorageObject {
  [key: string]: SessionType;
}

let storage: StorageObject = {};

export class MemoryStorage extends BaseStorage implements SessionStorage {
  read(sessionId: string): Promise<SessionType> {
    return Promise.resolve(storage[sessionId]);
  }

  create(sessionId: string, attributes: Partial<SessionType>): Promise<SessionType> {
    // @ts-ignore
    storage[sessionId] = { sessionId, ...attributes };
    this.emit('create', storage[sessionId]);
    return this.read(sessionId);
  }

  update(sessionId: string, updates: Partial<SessionType>): Promise<SessionType> {
    delete updates.sessionId;
    storage[sessionId] = Object.assign(storage[sessionId], updates);
    this.emit('update', storage[sessionId]);
    if (updates.status && this.isFinalized(updates.status)) {
      this.deleteFinalized(sessionId);
    }

    return this.read(sessionId);
  }

  // @ts-ignore
  delete(sessionId: string): Promise<void> {
    this.emit('delete', storage[sessionId]);
    delete storage[sessionId];
  }

  // @ts-ignore
  clear(): Promise<void> {
    storage = {};
  }
}
