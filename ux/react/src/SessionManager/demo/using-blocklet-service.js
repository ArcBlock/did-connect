/* eslint-disable react/jsx-filename-extension */
import get from 'lodash/get';
import SessionManager from '..';
import { createAuthServiceSessionContext } from '../../Session';

const { SessionProvider, SessionConsumer } = createAuthServiceSessionContext();

export default function Demo() {
  const tmp = new URL(window.location.origin);
  tmp.pathname = '/.well-known/service/api/connect/relay';

  return (
    <SessionProvider serviceHost={get(window, 'blocklet.prefix', '/')} relayUrl={tmp.href} autoConnect={false}>
      <SessionConsumer>{({ session }) => <SessionManager session={session} showText showRole />}</SessionConsumer>
    </SessionProvider>
  );
}
