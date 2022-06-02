"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _jsCookie = _interopRequireDefault(require("js-cookie"));

var _Util = require("@arcblock/ux/lib/Util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class CookieStorageEngine {
  constructor(storageKey, options) {
    this.storageKey = storageKey;
    this.options = options || {};
  }

  setToken(token) {
    return _jsCookie.default.set(this.storageKey, token, (0, _Util.getCookieOptions)(this.options));
  }

  getToken() {
    return _jsCookie.default.get(this.storageKey);
  }

  removeToken() {
    return _jsCookie.default.remove(this.storageKey, (0, _Util.getCookieOptions)(this.options));
  }

}

exports.default = CookieStorageEngine;