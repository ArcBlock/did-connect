import Cookie from 'js-cookie';
import { getCookieOptions } from '@arcblock/ux/lib/Util';

export default class CookieStorageEngine {
  constructor(storageKey, options) {
    this.storageKey = storageKey;
    this.options = options || {};
  }

  setToken(token) {
    return Cookie.set(this.storageKey, token, getCookieOptions(this.options));
  }

  getToken() {
    return Cookie.get(this.storageKey);
  }

  removeToken() {
    return Cookie.remove(this.storageKey, getCookieOptions(this.options));
  }
}
