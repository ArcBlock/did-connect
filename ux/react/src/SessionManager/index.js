/* eslint-disable react/no-array-index-key  */
/* eslint-disable react/jsx-no-bind */
import { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, ClickAwayListener, MenuList, MenuItem, Paper, Popper, SvgIcon, Button, Chip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import AccountOutline from 'mdi-material-ui/AccountOutline';
import ShieldCheck from 'mdi-material-ui/ShieldCheck';
import OpenInIcon from '@arcblock/icons/lib/OpenIn';
import DisconnectIcon from '@arcblock/icons/lib/Disconnect';
import SwitchDidIcon from '@arcblock/icons/lib/Switch';
import SwitchProfileIcon from '@mui/icons-material/PersonOutline';
import SwitchPassportIcon from '@mui/icons-material/VpnKeyOutlined';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';

import DidAvatar from '../Avatar';
import DidAddress from '../Address';

const messages = {
  zh: {
    switchDid: '切换账户',
    switchProfile: '切换用户信息',
    switchPassport: '切换通行证',
    disconnect: '退出',
    connect: '登录',
    openInWallet: '打开 DID 钱包',
  },
  en: {
    switchDid: 'Switch DID',
    switchProfile: 'Switch Profile',
    switchPassport: 'Switch Passport',
    disconnect: 'Disconnect',
    connect: 'Connect',
    openInWallet: 'Open DID Wallet',
  },
};

const useStyles = makeStyles((theme) => ({
  root: {},
  user: {
    fontSize: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '24px 24px 10px',
  },
  userName: {
    fontSize: 20,
    color: ({ dark }) => (dark ? '#aaa' : '#222'),
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuList: {
    padding: 0,
  },
  menuItem: {
    padding: '18.5px 24px',
    color: '#777',
    fontSize: 16,
    '&:hover': {
      backgroundColor: '#fbfbfb',
    },
  },
  menuIcon: {
    color: '#999',
    marginRight: 16,
  },
  popper: {
    zIndex: theme.zIndex.tooltip,
  },
  paper: {
    borderColor: '#F0F0F0',
    boxShadow: '0px 8px 12px rgba(92, 92, 92, 0.04)',
    borderRadius: theme.spacing(2),
    overflow: 'hidden',
    maxWidth: 'calc(100vw - 10px)',
    '& .MuiChip-root .MuiChip-icon': {
      color: theme.palette.success.main,
    },
  },
  darkPaper: {
    backgroundColor: '#27282c',
    color: '#fff',
    border: 0,
    '& .MuiChip-root': {
      borderColor: '#aaa',
    },
    '& .MuiListItem-root, & .MuiChip-label': {
      color: '#aaa',
    },
    '& .MuiListItem-root:hover': {
      backgroundColor: '#363434',
    },
  },
  role: {
    height: 'auto',
    marginRight: 0,
  },
  loginButton: {
    borderRadius: '100vw',
  },
  darkLoginButton: {
    color: '#fff',
    borderColor: '#fff',
  },
}));

function SessionManager({
  session,
  locale,
  showText,
  showRole,
  switchDid,
  switchProfile,
  switchPassport,
  disableLogout,
  onLogin,
  onLogout,
  onSwitchDid,
  onSwitchProfile,
  onSwitchPassport,
  menu,
  menuRender,
  dark,
  size,
  ...rest
}) {
  const userAnchorRef = useRef(null);
  const classes = useStyles({ dark });
  const [userOpen, setUserOpen] = useState(false);

  // base64 img maybe have some blank char, need encodeURIComponent to transform it
  const avatar = session.user?.avatar?.replace(/\s/g, encodeURIComponent(' '));
  const currentRole = useMemo(
    () => session.user?.passports?.find((item) => item.name === session.user.role),
    [session.user]
  );
  const browser = useBrowser();

  if (!session.user) {
    return showText ? (
      <Button
        className={`${classes.loginButton} ${dark && classes.darkLoginButton}`}
        variant="outlined"
        onClick={_onLogin}
        {...rest}
        data-cy="sessionManager-login"
      >
        <SvgIcon component={AccountOutline} />
        <span style={{ lineHeight: '25px' }}>{messages[locale].connect}</span>
      </Button>
    ) : (
      <IconButton {...rest} onClick={_onLogin} data-cy="sessionManager-login" size="large">
        {/* AccountOutline实际显示尺寸会偏小一点，适当增大尺寸可以和登陆后尺寸相等 */}
        <SvgIcon component={AccountOutline} style={{ fontSize: size * 1.14286, color: dark ? '#fff' : '' }} />
      </IconButton>
    );
  }

  function onToggleUser() {
    setUserOpen((prevOpen) => !prevOpen);
  }

  function onCloseUser(e) {
    if (userAnchorRef.current && userAnchorRef.current.contains(e.target)) {
      return;
    }
    setUserOpen(false);
  }

  function _onLogin() {
    session.login(onLogin);
  }
  function _onLogout() {
    session.logout((...args) => {
      setUserOpen(false);
      onLogout(...args);
    });
  }
  function _onSwitchDid() {
    session.switchDid((...args) => {
      setUserOpen(false);
      onSwitchDid(...args);
    });
  }
  function _onSwitchProfile() {
    session.switchProfile((...args) => {
      setUserOpen(false);
      onSwitchProfile(...args);
    });
  }
  function _onSwitchPassport() {
    setUserOpen(false);
    session.switchPassport((...args) => {
      setUserOpen(false);
      onSwitchPassport(...args);
    });
  }

  return (
    <>
      <IconButton
        ref={userAnchorRef}
        onClick={onToggleUser}
        className={classes.root}
        {...rest}
        data-cy="sessionManager-logout-popup"
        size="large"
      >
        <DidAvatar variant="circle" did={session.user.did} src={avatar} size={size} shape="circle" />
      </IconButton>
      {userAnchorRef.current && (
        <Popper
          className={classes.popper}
          open={userOpen}
          disablePortal
          anchorEl={userAnchorRef.current}
          placement="bottom-end"
        >
          <Paper className={`${classes.paper} ${dark && classes.darkPaper}`} variant="outlined">
            <ClickAwayListener onClickAway={onCloseUser}>
              <MenuList className={classes.menuList}>
                <div className={classes.user}>
                  <div className={classes.userName}>
                    <span>{session.user.fullName}</span>
                    {!!showRole && (currentRole?.title || session.user?.role.toUpperCase()) && (
                      <Chip
                        label={currentRole?.title || session.user?.role.toUpperCase()}
                        size="small"
                        variant="outlined"
                        className={classes.role}
                        icon={<SvgIcon component={ShieldCheck} size="small" />}
                      />
                    )}
                  </div>
                  <DidAddress responsive={false}>{session.user.did}</DidAddress>
                </div>
                {Array.isArray(menu) &&
                  menu.map((menuItem, index) => {
                    return (
                      <MenuItem
                        key={index}
                        className={classes.menuItem}
                        {...{
                          ...menuItem,
                          icon: undefined,
                          label: undefined,
                        }}
                      >
                        {menuItem.svgIcon
                          ? menuItem.svgIcon && <SvgIcon component={menuItem.svgIcon} className={classes.menuIcon} />
                          : menuItem.icon}
                        {menuItem.label}
                      </MenuItem>
                    );
                  })}
                {menuRender({
                  classes: {
                    menuItem: classes.menuItem,
                    menuIcon: classes.menuIcon,
                  },
                })}
                {!browser.wallet && (
                  <MenuItem
                    component="a"
                    className={classes.menuItem}
                    data-cy="sessionManager-openInWallet"
                    href="https://www.abtwallet.io/"
                    target="_blank"
                  >
                    <SvgIcon component={OpenInIcon} className={classes.menuIcon} />
                    {messages[locale].openInWallet}
                  </MenuItem>
                )}
                {!!switchDid && (
                  <MenuItem className={classes.menuItem} onClick={_onSwitchDid} data-cy="sessionManager-switch-trigger">
                    <SvgIcon component={SwitchDidIcon} className={classes.menuIcon} />
                    {messages[locale].switchDid}
                  </MenuItem>
                )}
                {!!switchProfile && (
                  <MenuItem
                    className={classes.menuItem}
                    onClick={_onSwitchProfile}
                    data-cy="sessionManager-switch-profile-trigger"
                  >
                    <SvgIcon component={SwitchProfileIcon} className={classes.menuIcon} />
                    {messages[locale].switchProfile}
                  </MenuItem>
                )}
                {!!switchPassport && (
                  <MenuItem
                    className={classes.menuItem}
                    onClick={_onSwitchPassport}
                    data-cy="sessionManager-switch-passport-trigger"
                  >
                    <SvgIcon component={SwitchPassportIcon} className={classes.menuIcon} />
                    {messages[locale].switchPassport}
                  </MenuItem>
                )}
                <MenuItem
                  className={classes.menuItem}
                  onClick={_onLogout}
                  disabled={disableLogout}
                  data-cy="sessionManager-logout-trigger"
                >
                  <SvgIcon component={DisconnectIcon} className={classes.menuIcon} />
                  {messages[locale].disconnect}
                </MenuItem>
              </MenuList>
            </ClickAwayListener>
          </Paper>
        </Popper>
      )}
    </>
  );
}

SessionManager.propTypes = {
  session: PropTypes.shape({
    user: PropTypes.shape({
      did: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      fullName: PropTypes.string,
      avatar: PropTypes.string,
      passports: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          title: PropTypes.string.isRequired,
        })
      ),
    }),
    login: PropTypes.func.isRequired,
    logout: PropTypes.func.isRequired,
    switchDid: PropTypes.func.isRequired,
    switchProfile: PropTypes.func.isRequired,
    switchPassport: PropTypes.func.isRequired,
  }).isRequired,
  locale: PropTypes.string,
  showText: PropTypes.bool,
  showRole: PropTypes.bool,
  switchDid: PropTypes.bool,
  switchProfile: PropTypes.bool,
  switchPassport: PropTypes.bool,
  disableLogout: PropTypes.bool,
  onLogin: PropTypes.func,
  onLogout: PropTypes.func,
  onSwitchDid: PropTypes.func,
  onSwitchProfile: PropTypes.func,
  onSwitchPassport: PropTypes.func,
  menu: PropTypes.array,
  menuRender: PropTypes.func,
  dark: PropTypes.bool,
  size: PropTypes.number,
};

const noop = () => {};

SessionManager.defaultProps = {
  locale: 'en',
  showText: false,
  showRole: false,
  switchDid: true,
  switchProfile: true,
  switchPassport: true,
  disableLogout: false,
  menu: [],
  menuRender: noop,
  onLogin: noop,
  onLogout: noop,
  onSwitchDid: noop,
  onSwitchProfile: noop,
  onSwitchPassport: noop,
  dark: false,
  size: 28,
};

export default SessionManager;
