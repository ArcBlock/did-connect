import Cookie from 'js-cookie';
import { getCookieOptions } from '@arcblock/ux/lib/Util';

import { StorageEngine } from '../types';

export default class CookieStorageEngine implements StorageEngine {
  options: any;

  storageKey: any;

  constructor(storageKey: any, options: any) {
    this.storageKey = storageKey;
    this.options = options || {};
  }

  setToken(token: string) {
    return Cookie.set(this.storageKey, token, getCookieOptions(this.options));
  }

  getToken() {
    return Cookie.get(this.storageKey);
  }

  removeToken() {
    return Cookie.remove(this.storageKey, getCookieOptions(this.options));
  }
}
