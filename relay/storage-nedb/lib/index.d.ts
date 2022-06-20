import BaseStorage, { SessionStorageOptions } from '@did-connect/storage';
import { SessionType } from '@did-connect/types';
export declare type NedbStorageOptions = SessionStorageOptions & {
    dbPath: string;
    dbPort?: number;
};
declare type Callback = (...args: any[]) => void;
interface NeDBInstance {
    loadDatabase(cb: Callback): Promise<void>;
    findOne(conditions: any, cb: Callback): Promise<any>;
    update(query: any, update: any, cb: Callback): Promise<any>;
    update(query: any, update: any, options: any, cb: Callback): Promise<any>;
    insert(doc: any, cb: Callback): Promise<any>;
    insert(doc: any, options: any, cb: Callback): Promise<any>;
    remove(conditions: any, cb: Callback): Promise<any>;
    remove(conditions: any, options: any, cb: Callback): Promise<any>;
}
export default class NedbStorage extends BaseStorage {
    db: NeDBInstance;
    /**
     * Creates an instance of DiskSessionStorage.
     *
     * @class
     * @param {Object} options { dbPath }
     * @param {string} options.dbPath - where to store the database on disk
     */
    constructor(options: NedbStorageOptions);
    read(sessionId: string): Promise<SessionType>;
    create(sessionId: string, attributes: Partial<SessionType>): Promise<SessionType>;
    update(sessionId: string, updates: Partial<SessionType>): Promise<SessionType>;
    delete(sessionId: string): Promise<void>;
    clear(): Promise<void>;
}
export {};
