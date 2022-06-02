"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createStorage;

var _cookie = _interopRequireDefault(require("./engine/cookie"));

var _localStorage = _interopRequireDefault(require("./engine/local-storage"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createStorage() {
  let storageKey = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'did.auth.token';
  let storageEngine = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'ls';
  let storageOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  if (!storageKey) {
    throw new Error('storageKey must be specified to create a storage');
  }

  let storage = null;

  if (storageEngine === 'ls') {
    storage = new _localStorage.default(storageKey, storageOptions);
  } else if (storageEngine === 'cookie') {
    storage = new _cookie.default(storageKey, storageOptions);
  } else {
    throw new Error('storageEngine must be ls or cookie');
  }

  return {
    getToken: storage.getToken.bind(storage),
    setToken: storage.setToken.bind(storage),
    removeToken: storage.removeToken.bind(storage),
    engine: storageEngine,
    key: storageKey
  };
}