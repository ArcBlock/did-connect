import CookieEngine from './engine/cookie';
import LocalStorageEngine from './engine/local-storage';

export default function createStorage(storageKey = 'did.auth.token', storageEngine = 'ls', storageOptions = {}) {
  if (!storageKey) {
    throw new Error('storageKey must be specified to create a storage');
  }

  let storage = null;
  if (storageEngine === 'ls') {
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 2.
    storage = new LocalStorageEngine(storageKey, storageOptions);
  } else if (storageEngine === 'cookie') {
    storage = new CookieEngine(storageKey, storageOptions);
  } else {
    throw new Error('storageEngine must be ls or cookie');
  }

  return {
    getToken: storage.getToken.bind(storage),
    setToken: storage.setToken.bind(storage),
    removeToken: storage.removeToken.bind(storage),
    engine: storageEngine,
    key: storageKey,
  };
}
