const StorageInterface = require('@did-connect/storage');

let storage = {};

module.exports = class MemorySessionStorage extends StorageInterface {
  read(sessionId) {
    return storage[sessionId];
  }

  create(sessionId, attributes = { status: 'created' }) {
    storage[sessionId] = { sessionId, ...attributes };
    this.emit('create', storage[sessionId]);
    return this.read(sessionId);
  }

  update(sessionId, updates) {
    delete updates.sessionId;
    storage[sessionId] = Object.assign(storage[sessionId], updates);
    this.emit('update', storage[sessionId]);
    return storage[sessionId];
  }

  delete(sessionId) {
    this.emit('destroy', storage[sessionId]);
    delete storage[sessionId];
  }

  exist(sessionId, did) {
    return storage[sessionId] && storage[sessionId].did === did;
  }

  clear() {
    storage = {};
  }
};
