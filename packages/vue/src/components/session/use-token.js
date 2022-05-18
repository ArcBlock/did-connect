import { useStorage } from '@vueuse/core';
import { TOKEN_KEY } from './constants';
import useCookies from '../../hooks/use-cookies';

export default ({ engine = 'cookie', options = {} } = {}) => {
  const storage = engine === 'cookie' ? useCookies(TOKEN_KEY, null, options) : useStorage(TOKEN_KEY);
  return storage;
};
