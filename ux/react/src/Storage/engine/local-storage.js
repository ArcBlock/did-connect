export default class LocalStorageEngine {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  setToken(token) {
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
