"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createService;

var _axios = _interopRequireDefault(require("axios"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createService(baseURL, storage) {
  let timeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 10000;

  const service = _axios.default.create({
    baseURL,
    timeout
  });

  service.interceptors.request.use(config => {
    if (storage.engine === 'ls') {
      const token = storage.getToken();

      if (token) {
        config.headers.authorization = "Bearer ".concat(encodeURIComponent(token));
      }
    }

    return config;
  }, error => Promise.reject(error));
  return service;
}