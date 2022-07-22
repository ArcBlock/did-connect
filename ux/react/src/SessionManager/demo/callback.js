/* eslint-disable react/jsx-filename-extension */
import SessionManager from '..';

const sessionLogin = {
  login: () => {},
  logout: (cb) => {
    cb();
  },
  user: {
    passports: [{ name: 'admin', title: 'Admin' }],
    fullName: 'ZH',
    avatar: '',
    did: 'z1exXZY2A7G4JuYv3AMzjCmioyQGQ4y3wtu',
    role: 'admin',
  },
};
const sessionNotLogin = {
  login: (cb) => {
    cb();
  },
  logout: () => {},
  user: null,
};

export default function Demo(props) {
  return (
    <>
      <h4>login callback</h4>
      <SessionManager session={sessionNotLogin} onLogin={() => {}} {...props} />
      <h4>logout callback</h4>
      <SessionManager session={sessionLogin} onLogout={() => {}} {...props} />
    </>
  );
}
