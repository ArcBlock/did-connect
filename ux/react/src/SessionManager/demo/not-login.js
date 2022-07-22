/* eslint-disable react/jsx-filename-extension */
import get from 'lodash/get';
import SessionManager from '..';
import { createAuthServiceSessionContext } from '../../Session';

const { SessionProvider } = createAuthServiceSessionContext();

const sessionNotLogin = {
  login: (cb) => {
    cb();
  },
  logout: () => {},
  user: null,
};

export default function Demo() {
  const tmp = new URL(window.location.origin);
  tmp.pathname = '/.well-known/service/api/connect/relay';
  return (
    <SessionProvider serviceHost={get(window, 'blocklet.prefix', '/')} relayUrl={tmp.href} autoConnect={false}>
      <h4>Default</h4>
      <SessionManager session={sessionNotLogin} />
      <h4>showText</h4>
      <SessionManager session={sessionNotLogin} showText />
    </SessionProvider>
  );
}
