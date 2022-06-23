export default class LocalStorageEngine {
  storageKey: any;

  constructor(storageKey: any) {
    this.storageKey = storageKey;
  }

  setToken(token: any) {
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
