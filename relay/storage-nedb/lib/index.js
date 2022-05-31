/* eslint-disable no-underscore-dangle */
const Nedb = require('@nedb/core');
const NedbMulti = require('@nedb/multi');
const StorageInterface = require('@did-connect/storage');

const debug = require('debug')(require('../package.json').name);

module.exports = class DiskSessionStorage extends StorageInterface {
  /**
   * Creates an instance of DiskSessionStorage.
   *
   * @class
   * @param {Object} options { dbPath }
   * @param {string} options.dbPath - where to store the database on disk
   */
  constructor(options = {}) {
    super(options);

    if (!options.dbPath) {
      throw new Error('DiskSessionStorage requires a valid dbPath option to initialize');
    }

    this.options = options;

    const DataStore = options.dbPort ? NedbMulti(options.dbPort) : Nedb;

    this.db = new DataStore(
      Object.assign(
        {
          filename: options.dbPath,
          autoload: true,
          timestampData: true,
        },
        options
      )
    );

    this.db.loadDatabase((err) => {
      if (err) {
        debug(`failed to load disk database ${options.dbPath}`, { error: err });
      }
    });

    // TODO: we may need a ready state if the database file is too large
  }

  read(sessionId) {
    return new Promise((resolve, reject) => {
      if (!sessionId) {
        reject(new Error('sessionId is required to read auth record'));
        return;
      }
      this.db.findOne({ sessionId }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
    });
  }

  create(sessionId, attributes = { status: 'created' }) {
    return new Promise((resolve, reject) => {
      if (!sessionId) {
        reject(new Error('sessionId is required to create auth record'));
        return;
      }
      this.db.insert({ sessionId, ...attributes }, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          this.emit('create', doc);
          debug('emit.create', { sessionId, ...attributes });
          resolve(doc);
        }
      });
    });
  }

  update(sessionId, updates = {}) {
    return new Promise((resolve, reject) => {
      if (!sessionId) {
        reject(new Error('sessionId is required to update auth record'));
        return;
      }
      this.db.update(
        { sessionId },
        { $set: updates },
        { multi: false, upsert: false, returnUpdatedDocs: true },
        (err, numAffected, doc) => {
          if (err) {
            reject(err);
          } else {
            this.emit('update', doc);
            debug('emit.update', { sessionId, updates });
            resolve(doc);
          }
        }
      );
    });
  }

  delete(sessionId) {
    return new Promise((resolve, reject) => {
      if (!sessionId) {
        reject(new Error('sessionId is required to delete auth record'));
        return;
      }
      this.db.remove({ sessionId }, { multi: true }, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          this.emit('destroy', sessionId);
          resolve(numRemoved);
        }
      });
    });
  }

  exist(sessionId, did) {
    return new Promise((resolve, reject) => {
      if (!sessionId) {
        reject(new Error('sessionId is required to check auth record'));
        return;
      }
      this.db.findOne({ sessionId, did }, (err, doc) => {
        if (err) {
          resolve(false);
        } else {
          resolve(!!doc);
        }
      });
    });
  }

  clear() {
    return new Promise((resolve, reject) => {
      this.db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve(numRemoved);
        }
      });
    });
  }
};
