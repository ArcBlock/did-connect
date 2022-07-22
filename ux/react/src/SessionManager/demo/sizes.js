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

export default function Demo() {
  return (
    <>
      <h4>Default size (28)</h4>
      <SessionManager session={sessionNotLogin} />
      <SessionManager session={sessionLogin} />
      <h4>size 20</h4>
      <SessionManager session={sessionNotLogin} size={20} />
      <SessionManager session={sessionLogin} size={20} />
      <h4>size 40</h4>
      <SessionManager session={sessionNotLogin} size={40} />
      <SessionManager session={sessionLogin} size={40} />
    </>
  );
}
