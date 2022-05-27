/* eslint-disable no-useless-constructor */
/* eslint-disable no-unused-vars */
const { EventEmitter } = require('events');

/**
 * Defines the interface of DID-Auth Token Storage
 * Which is used to persist state during the DID-Auth process in a dApp
 *
 * @class SessionStorage
 * @see @did-connect/storage-firebase
 * @see @did-connect/storage-mongo
 * @see @did-connect/storage-keystone
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

  create(token, status = 'created') {
    throw new Error('SessionStorage.create must be implemented in child class');
  }

  read(token) {
    throw new Error('SessionStorage.read must be implemented in child class');
  }

  update(token, updates) {
    throw new Error('SessionStorage.update must be implemented in child class');
  }

  delete(token) {
    throw new Error('SessionStorage.delete must be implemented in child class');
  }

  exist(token, did) {
    throw new Error('SessionStorage.exist must be implemented in child class');
  }
}

module.exports = SessionStorage;
