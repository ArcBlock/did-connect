import { TStorageEngine } from '../../types';

export default class LocalStorageEngine implements TStorageEngine {
  storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  setToken(token: string) {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return undefined;
    }
    return localStorage.setItem(this.storageKey, token);
  }

  getToken() {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return undefined;
    }

    return localStorage.getItem(this.storageKey);
  }

  removeToken() {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return undefined;
    }

    return localStorage.removeItem(this.storageKey);
  }
}
