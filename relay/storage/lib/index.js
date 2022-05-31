/* eslint-disable no-useless-constructor */
/* eslint-disable no-unused-vars */
const { EventEmitter } = require('events');

/**
 * Defines the interface of DID Connect Session Storage
 * Which is used to persist state during the DID Connect process between dApp and wallet
 *
 * @class SessionStorage
 * @see @did-connect/relay-storage-firebase
 * @see @did-connect/relay-storage-mongo
 * @see @did-connect/relay-storage-keystone
 * @extends {EventEmitter}
 */
class SessionStorage extends EventEmitter {
  /**
   * Creates an instance of SessionStorage.
   *
   * @class
   * @param {object} options
   */
  constructor(options) {
    super(options);
  }

  create(sessionId, attributes) {
    throw new Error('SessionStorage.create must be implemented in child class');
  }

  read(sessionId) {
    throw new Error('SessionStorage.read must be implemented in child class');
  }

  update(sessionId, updates) {
    throw new Error('SessionStorage.update must be implemented in child class');
  }

  delete(sessionId) {
    throw new Error('SessionStorage.delete must be implemented in child class');
  }

  exist(sessionId, did) {
    throw new Error('SessionStorage.exist must be implemented in child class');
  }
}

module.exports = SessionStorage;
