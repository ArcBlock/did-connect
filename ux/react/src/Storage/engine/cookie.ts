import Cookie from 'js-cookie';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '@arc... Remove this comment to see the full error message
import { getCookieOptions } from '@arcblock/ux/lib/Util';

export default class CookieStorageEngine {
  options: any;

  storageKey: any;

  constructor(storageKey: any, options: any) {
    this.storageKey = storageKey;
    this.options = options || {};
  }

  setToken(token: any) {
    return Cookie.set(this.storageKey, token, getCookieOptions(this.options));
  }

  getToken() {
    return Cookie.get(this.storageKey);
  }

  removeToken() {
    return Cookie.remove(this.storageKey, getCookieOptions(this.options));
  }
}
