import BaseStorage from '@did-connect/storage';
import { SessionType } from '@did-connect/types';

type ExtendedSession = SessionType & {
  sessionId: string;
};

interface SessionStorage {
  [key: string]: ExtendedSession;
}

let storage: SessionStorage = {};

export default class MemoryStorage extends BaseStorage {
  read(sessionId: string): Promise<ExtendedSession> {
    return Promise.resolve(storage[sessionId]);
  }

  create(sessionId: string, attributes: Partial<ExtendedSession>): Promise<ExtendedSession> {
    // @ts-ignore
    storage[sessionId] = { sessionId, ...attributes };
    this.emit('create', storage[sessionId]);
    return this.read(sessionId);
  }

  update(sessionId: string, updates: Partial<ExtendedSession>): Promise<ExtendedSession> {
    delete updates.sessionId;
    storage[sessionId] = Object.assign(storage[sessionId], updates);
    this.emit('update', storage[sessionId]);
    if (updates.status && this.isFinalized(updates.status)) {
      this.deleteFinalized(sessionId);
    }

    return this.read(sessionId);
  }

  delete(sessionId: string): void {
    this.emit('delete', storage[sessionId]);
    delete storage[sessionId];
  }

  clear() {
    storage = {};
  }
}
