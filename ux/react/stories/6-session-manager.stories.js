/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-alert */
import { storiesOf } from '@storybook/react';

import { LocaleProvider } from '@arcblock/ux/lib/Locale/context';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import SvgIcon from '@mui/material/SvgIcon';
import Settings from '@mui/icons-material/Settings';
import SessionManager from '../src/SessionManager';
import { createAuthServiceSessionContext } from '../src/Session';

// 检查 SessionProvider 可正常渲染
const { SessionProvider } = createAuthServiceSessionContext();

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

storiesOf('DID-Connect/SessionManager', module)
  .add('has login', () => (
    <LocaleProvider>
      <h4>With role</h4>
      <SessionManager session={sessionLogin} showRole />
      <hr />
      <h4>Default role</h4>
      <SessionManager session={{ ...sessionLogin, user: { ...sessionLogin.user, passports: [] } }} showRole />
      <hr />
      <h4>Without role</h4>
      <SessionManager session={sessionLogin} />
      <hr />
      <h4>Disable logout</h4>
      <SessionManager session={sessionLogin} disableLogout />
      <hr />
      <h4>With menu</h4>
      <SessionManager
        session={sessionLogin}
        menu={[
          {
            label: 'Svg Icon',
            svgIcon: Settings,
            onClick: () => alert('Svg Icon'),
          },
          {
            label: 'Raw Icon',
            icon: <Settings />,
            onClick: () => alert('Raw Icon'),
          },
        ]}
      />
      <h4>With menuRender</h4>
      <SessionManager
        session={sessionLogin}
        menuRender={({ classes }) => (
          <MenuItem onClick className={classes.menuItem}>
            <SvgIcon component={Settings} className={classes.menuIcon} />
            Menu Render
          </MenuItem>
        )}
      />
    </LocaleProvider>
  ))
  .add('not login', () => (
    <SessionProvider value={{}}>
      <LocaleProvider>
        <h4>Default</h4>
        <SessionManager session={sessionNotLogin} />
        <h4>showText</h4>
        <SessionManager session={sessionNotLogin} showText />
      </LocaleProvider>
    </SessionProvider>
  ))
  .add('callback', () => (
    <LocaleProvider>
      <h4>login callback</h4>
      <SessionManager session={sessionNotLogin} onLogin={() => alert('after login')} />
      <h4>logout callback</h4>
      <SessionManager session={sessionLogin} onLogout={() => alert('after logout')} />
    </LocaleProvider>
  ))
  .add('dark mode', () => (
    <Box height="100vh" p={3} bgcolor="#000">
      <LocaleProvider>
        <h4 style={{ color: '#fff' }}>Default</h4>
        <SessionManager dark session={sessionNotLogin} />
        <h4 style={{ color: '#fff' }}>With role</h4>
        <SessionManager dark session={sessionLogin} showRole />
        <h4 style={{ color: '#fff' }}>showText</h4>
        <SessionManager dark session={sessionNotLogin} showText />
      </LocaleProvider>
    </Box>
  ))
  .add('size', () => (
    <LocaleProvider>
      <h4>Default size (28)</h4>
      <SessionManager session={sessionNotLogin} />
      <SessionManager session={sessionLogin} />
      <h4>size 20</h4>
      <SessionManager session={sessionNotLogin} size={20} />
      <SessionManager session={sessionLogin} size={20} />
      <h4>size 40</h4>
      <SessionManager session={sessionNotLogin} size={40} />
      <SessionManager session={sessionLogin} size={40} />
    </LocaleProvider>
  ));
