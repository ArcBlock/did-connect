import { TAnyObject } from '@did-connect/types';

import CookieEngine from './engine/cookie';
import LocalStorageEngine from './engine/local-storage';
import { TStorageEngineCode, TStorageEngine } from '../types';

export default function createStorage(
  storageKey: string = 'did.auth.token',
  storageEngine: TStorageEngineCode = 'ls',
  storageOptions: TAnyObject = {}
): TStorageEngine {
  if (!storageKey) {
    throw new Error('storageKey must be specified to create a storage');
  }

  let storage = null;
  if (storageEngine === 'ls') {
    storage = new LocalStorageEngine(storageKey);
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
