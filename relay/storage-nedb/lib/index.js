"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-underscore-dangle */
// @ts-ignore
const core_1 = __importDefault(require("@nedb/core"));
// @ts-ignore
const multi_1 = __importDefault(require("@nedb/multi"));
const storage_1 = __importDefault(require("@did-connect/storage"));
const debug = require('debug')(require('../package.json').name);
class NedbStorage extends storage_1.default {
    /**
     * Creates an instance of DiskSessionStorage.
     *
     * @class
     * @param {Object} options { dbPath }
     * @param {string} options.dbPath - where to store the database on disk
     */
    constructor(options) {
        super(options);
        if (!options.dbPath) {
            throw new Error('DiskSessionStorage requires a valid dbPath option to initialize');
        }
        const DataStore = options.dbPort ? (0, multi_1.default)(options.dbPort) : core_1.default;
        this.db = new DataStore(Object.assign({
            filename: options.dbPath,
            autoload: true,
            timestampData: true,
        }, options));
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
                }
                else {
                    resolve(doc);
                }
            });
        });
    }
    create(sessionId, attributes) {
        return new Promise((resolve, reject) => {
            if (!sessionId) {
                reject(new Error('sessionId is required to create auth record'));
                return;
            }
            this.db.insert(Object.assign({ sessionId }, attributes), (err, doc) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.emit('create', doc);
                    debug('emit.create', Object.assign({ sessionId }, attributes));
                    resolve(doc);
                }
            });
        });
    }
    update(sessionId, updates) {
        return new Promise((resolve, reject) => {
            if (!sessionId) {
                reject(new Error('sessionId is required to update auth record'));
                return;
            }
            this.db.update({ sessionId }, { $set: updates }, { multi: false, upsert: false, returnUpdatedDocs: true }, (err, numAffected, doc) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.emit('update', doc);
                    debug('emit.update', { sessionId, updates });
                    if (updates.status && this.isFinalized(updates.status)) {
                        this.deleteFinalized(sessionId).catch(console.error);
                    }
                    resolve(doc);
                }
            });
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
                }
                else {
                    this.emit('delete', sessionId);
                    resolve(numRemoved);
                }
            });
        });
    }
    clear() {
        return new Promise((resolve, reject) => {
            this.db.remove({}, { multi: true }, (err, numRemoved) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(numRemoved);
                }
            });
        });
    }
}
exports.default = NedbStorage;
