/* eslint-disable react/jsx-filename-extension */
import MenuItem from '@mui/material/MenuItem';
import SvgIcon from '@mui/material/SvgIcon';
import Settings from '@mui/icons-material/Settings';
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

export default function Demo() {
  return (
    <>
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
        // eslint-disable-next-line react/no-unstable-nested-components
        menuRender={({ classes }) => (
          <MenuItem onClick className={classes.menuItem}>
            <SvgIcon component={Settings} className={classes.menuIcon} />
            Menu Render
          </MenuItem>
        )}
      />
    </>
  );
}
