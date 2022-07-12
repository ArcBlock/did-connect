import semver from 'semver';
import pick from 'lodash/pick';
import { getRandomBytes } from '@ocap/mcrypto';
import { stripHexPrefix } from '@ocap/util';
import type { TWalletInfo } from '@did-connect/types';

const getStepChallenge = (): string => stripHexPrefix(getRandomBytes(16)).toUpperCase();

const parseWalletUA = (userAgent: string): TWalletInfo => {
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
      // @ts-ignore because we have safety check in the if
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

  // @ts-ignore
  return { os, version, jwt };
};

const formatDisplay = (display: string | { [key: string]: any }): string => {
  if (display) {
    // object like
    if (typeof display === 'object' && display.type && display.content) {
      return JSON.stringify(pick(display, ['type', 'content']));
    }

    // string like
    if (typeof display === 'string') {
      try {
        const parsed = JSON.parse(display as string);
        if (parsed && parsed.type && parsed.content) {
          return display;
        }
        return '';
      } catch {
        // do nothing
      }
    }
  }

  return '';
};

export { getStepChallenge, parseWalletUA, formatDisplay };
