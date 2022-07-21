/* eslint-disable react/jsx-filename-extension */
import Box from '@mui/material/Box';
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
    <Box height="100vh" p={3} bgcolor="#000">
      <h4 style={{ color: '#fff' }}>Default</h4>
      <SessionManager dark session={sessionNotLogin} />
      <h4 style={{ color: '#fff' }}>With role</h4>
      <SessionManager dark session={sessionLogin} showRole />
      <h4 style={{ color: '#fff' }}>showText</h4>
      <SessionManager dark session={sessionNotLogin} showText />
    </Box>
  );
}
