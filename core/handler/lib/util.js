const semver = require('semver');
const pick = require('lodash/pick');
const { getRandomBytes } = require('@ocap/mcrypto');
const { stripHexPrefix } = require('@ocap/util');

const getStepChallenge = () => stripHexPrefix(getRandomBytes(16)).toUpperCase();

const parseWalletUA = (userAgent) => {
  const ua = (userAgent || '').toString().toLowerCase();
  let os = '';
  let version = '';
  if (ua.indexOf('android') > -1) {
    os = 'android';
  } else if (ua.indexOf('darwin') > -1) {
    os = 'ios';
  } else if (ua.indexOf('arcwallet') === 0) {
    os = 'web';
  }

  const match = ua.split(/\s+/).find((x) => x.startsWith('arcwallet'));
  if (match) {
    const tmp = match.split('/');
    if (tmp.length > 1 && semver.coerce(tmp[1])) {
      version = semver.coerce(tmp[1]).version;
    }
  }

  // NOTE: for ios v2.7.2+ and android v2.7.16+, we should adopt jwt v1.1
  let jwt = '1.0.0';
  if (os === 'ios' && version && semver.gte(version, '2.7.2')) {
    jwt = '1.1.0';
  } else if (os === 'android' && version && semver.gte(version, '2.7.16')) {
    jwt = '1.1.0';
  } else if (os === 'web') {
    jwt = '1.1.0';
  }

  return { os, version, jwt };
};

const formatDisplay = (display) => {
  // empty
  if (!display) {
    return '';
  }

  // object like
  if (display && display.type && display.content) {
    return JSON.stringify(pick(display, ['type', 'content']));
  }

  // string like
  try {
    const parsed = JSON.parse(display);
    if (parsed && parsed.type && parsed.content) {
      return display;
    }
    return '';
  } catch (err) {
    return '';
  }
};

module.exports = {
  getStepChallenge,
  parseWalletUA,
  formatDisplay,
};
