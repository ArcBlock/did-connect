"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDisplay = exports.parseWalletUA = exports.getStepChallenge = void 0;
const semver_1 = __importDefault(require("semver"));
const pick_1 = __importDefault(require("lodash/pick"));
const mcrypto_1 = require("@ocap/mcrypto");
const util_1 = require("@ocap/util");
const getStepChallenge = () => (0, util_1.stripHexPrefix)((0, mcrypto_1.getRandomBytes)(16)).toUpperCase();
exports.getStepChallenge = getStepChallenge;
const parseWalletUA = (userAgent) => {
    const ua = (userAgent || '').toString().toLowerCase();
    let os = '';
    let version = '0.1.0';
    if (ua.indexOf('android') > -1) {
        os = 'android';
    }
    else if (ua.indexOf('darwin') > -1) {
        os = 'ios';
    }
    else if (ua.indexOf('arcwallet') === 0) {
        os = 'web';
    }
    const match = ua.split(/\s+/).find((x) => x.startsWith('arcwallet'));
    if (match) {
        const tmp = match.split('/');
        if (tmp.length > 1 && semver_1.default.coerce(tmp[1])) {
            // @ts-ignore because we have safety check in the if
            version = semver_1.default.coerce(tmp[1]).version;
        }
    }
    // NOTE: for ios v2.7.2+ and android v2.7.16+, we should adopt jwt v1.1
    let jwt = '1.0.0';
    if (os === 'ios' && version && semver_1.default.gte(version, '2.7.2')) {
        jwt = '1.1.0';
    }
    else if (os === 'android' && version && semver_1.default.gte(version, '2.7.16')) {
        jwt = '1.1.0';
    }
    else if (os === 'web') {
        jwt = '1.1.0';
    }
    // @ts-ignore
    return { os, version, jwt };
};
exports.parseWalletUA = parseWalletUA;
const formatDisplay = (display) => {
    if (display) {
        // object like
        if (typeof display === 'object' && display.type && display.content) {
            return JSON.stringify((0, pick_1.default)(display, ['type', 'content']));
        }
        // string like
        if (typeof display === 'string') {
            try {
                const parsed = JSON.parse(display);
                if (parsed && parsed.type && parsed.content) {
                    return display;
                }
                return '';
            }
            catch (_a) {
                // do nothing
            }
        }
    }
    return '';
};
exports.formatDisplay = formatDisplay;
