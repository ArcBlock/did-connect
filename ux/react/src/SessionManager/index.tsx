/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable react/no-array-index-key  */
/* eslint-disable react/jsx-no-bind */
import { useMemo, useRef, useState } from 'react';
import { TLocaleCode } from '@did-connect/types';
import { styled } from '@arcblock/ux/lib/Theme';
import { IconButton, ClickAwayListener, MenuList, MenuItem, Paper, Popper, SvgIcon, Button, Chip } from '@mui/material';
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
import { TSessionUser } from '../types';

const noop = () => {};

const messages: { [key: string]: { [key: string]: string } } = {
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

type SessionManagerProps = {
  session: {
    user?: TSessionUser;
    login: (...args: any[]) => any;
    logout: (...args: any[]) => any;
    switchDid: (...args: any[]) => any;
    switchProfile: (...args: any[]) => any;
    switchPassport: (...args: any[]) => any;
  };
  locale?: TLocaleCode;
  showText?: boolean;
  showRole?: boolean;
  switchDid?: boolean;
  switchProfile?: boolean;
  switchPassport?: boolean;
  disableLogout?: boolean;
  onLogin?: (...args: any[]) => any;
  onLogout?: (...args: any[]) => any;
  onSwitchDid?: (...args: any[]) => any;
  onSwitchProfile?: (...args: any[]) => any;
  onSwitchPassport?: (...args: any[]) => any;
  menu?: any[];
  menuRender?: (...args: any[]) => any;
  dark?: boolean;
  size?: number;
};

export default function SessionManager({
  session,
  locale = 'en',
  showText = false,
  showRole = false,
  switchDid = true,
  switchProfile = true,
  switchPassport = true,
  disableLogout = false,
  menu = [],
  menuRender = noop,
  onLogin = noop,
  onLogout = noop,
  onSwitchDid = noop,
  onSwitchProfile = noop,
  onSwitchPassport = noop,
  dark = false,
  size = 28,
  ...rest
}: SessionManagerProps): JSX.Element {
  const userAnchorRef = useRef(null);
  const [userOpen, setUserOpen] = useState(false);

  // base64 img maybe have some blank char, need encodeURIComponent to transform it
  const avatar = session.user?.avatar?.replace(/\s/g, encodeURIComponent(' '));
  const currentRole = useMemo(
    () => session.user?.passports?.find((item) => item.name === session.user?.role),
    [session.user]
  );
  const browser = useBrowser();

  if (!session.user) {
    return showText ? (
      <Button
        sx={[{ borderRadius: '100vw' }, dark && { color: '#fff', borderColor: '#fff' }]}
        variant="outlined"
        onClick={_onLogin}
        aria-label="login button"
        {...rest}
        data-cy="sessionManager-login">
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

  function onCloseUser(e: any) {
    if (userAnchorRef.current && (userAnchorRef.current as any).contains(e.target)) {
      return;
    }
    setUserOpen(false);
  }

  function _onLogin() {
    session.login(onLogin);
  }
  function _onLogout() {
    session.logout((...args: any[]) => {
      setUserOpen(false);
      onLogout(...args);
    });
  }
  function _onSwitchDid() {
    setUserOpen(false);
    session.switchDid((...args: any[]) => {
      onSwitchDid(...args);
    });
  }
  function _onSwitchProfile() {
    setUserOpen(false);
    session.switchProfile((...args: any[]) => {
      onSwitchProfile(...args);
    });
  }
  function _onSwitchPassport() {
    setUserOpen(false);
    session.switchPassport((...args: any[]) => {
      onSwitchPassport(...args);
    });
  }

  return (
    <>
      <IconButton
        ref={userAnchorRef}
        onClick={onToggleUser}
        {...rest}
        data-cy="sessionManager-logout-popup"
        size="large">
        <DidAvatar variant="circle" did={session.user.did} src={avatar} size={size} shape="circle" />
      </IconButton>
      {userAnchorRef.current && (
        <StyledPopper
          open={userOpen}
          disablePortal
          anchorEl={userAnchorRef.current}
          placement="bottom-end"
          $dark={dark}>
          <Paper
            sx={[
              (theme) => ({
                borderColor: '#F0F0F0',
                boxShadow: '0px 8px 12px rgba(92, 92, 92, 0.04)',
                borderRadius: theme.spacing(2),
                overflow: 'hidden',
                maxWidth: 'calc(100vw - 10px)',
                '& .MuiChip-root .MuiChip-icon': {
                  color: theme.palette.success.main,
                },
              }),
              dark && {
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
            ]}
            variant="outlined">
            <ClickAwayListener onClickAway={onCloseUser}>
              <MenuList sx={{ p: 0 }}>
                <div className="session-manager-user">
                  <div className="session-manager-user-name">
                    <span>{session.user.fullName}</span>
                    {!!showRole && (currentRole?.title || session.user?.role.toUpperCase()) && (
                      <Chip
                        label={currentRole?.title || session.user?.role.toUpperCase()}
                        size="small"
                        variant="outlined"
                        sx={{ height: 'auto', marginRight: 0 }}
                        // @ts-ignore
                        icon={<SvgIcon component={ShieldCheck} size="small" />}
                      />
                    )}
                  </div>
                  <DidAddress responsive={false}>{session.user.did}</DidAddress>
                </div>
                {Array.isArray(menu) &&
                  menu.map((menuItem, index) => {
                    const { svgIcon, ...menuProps } = menuItem;
                    return (
                      <MenuItem
                        key={index}
                        className="session-manager-menu-item"
                        {...{
                          ...menuProps,
                          icon: undefined,
                          label: undefined,
                        }}>
                        {svgIcon
                          ? svgIcon && <SvgIcon component={svgIcon} className="session-manager-menu-icon" />
                          : menuItem.icon}
                        {menuItem.label}
                      </MenuItem>
                    );
                  })}
                {menuRender({
                  classes: {
                    menuItem: 'session-manager-menu-item',
                    menuIcon: 'session-manager-menu-icon',
                  },
                })}
                {!browser.wallet && (
                  <MenuItem
                    component="a"
                    className="session-manager-menu-item"
                    data-cy="sessionManager-openInWallet"
                    href="https://www.abtwallet.io/"
                    target="_blank">
                    <SvgIcon component={OpenInIcon} className="session-manager-menu-icon" />
                    {messages[locale].openInWallet}
                  </MenuItem>
                )}
                {!!switchDid && (
                  <MenuItem
                    className="session-manager-menu-item"
                    onClick={_onSwitchDid}
                    data-cy="sessionManager-switch-trigger">
                    <SvgIcon component={SwitchDidIcon} className="session-manager-menu-icon" />
                    {messages[locale].switchDid}
                  </MenuItem>
                )}
                {!!switchProfile && (
                  <MenuItem
                    className="session-manager-menu-item"
                    onClick={_onSwitchProfile}
                    data-cy="sessionManager-switch-profile-trigger">
                    <SvgIcon component={SwitchProfileIcon} className="session-manager-menu-icon" />
                    {messages[locale].switchProfile}
                  </MenuItem>
                )}
                {!!switchPassport && (
                  <MenuItem
                    className="session-manager-menu-item"
                    onClick={_onSwitchPassport}
                    data-cy="sessionManager-switch-passport-trigger">
                    <SvgIcon component={SwitchPassportIcon} className="session-manager-menu-icon" />
                    {messages[locale].switchPassport}
                  </MenuItem>
                )}
                <MenuItem
                  className="session-manager-menu-item"
                  onClick={_onLogout}
                  disabled={disableLogout}
                  data-cy="sessionManager-logout-trigger">
                  <SvgIcon component={DisconnectIcon} className="session-manager-menu-icon" />
                  {messages[locale].disconnect}
                </MenuItem>
              </MenuList>
            </ClickAwayListener>
          </Paper>
        </StyledPopper>
      )}
    </>
  );
}

const StyledPopper = styled(Popper)<any>`
  z-index: ${(props: any) => props.theme.zIndex.tooltip};
  .MuiList-root {
    width: 280px;
  }
  .session-manager-user {
    font-size: 12px;
    flex-direction: column;
    align-items: flex-start;
    padding: 24px 24px 10px;
  }
  .session-manager-user-name {
    font-size: 20px;
    color: ${(props: any) => (props.$dark ? '#aaa' : '#222')};
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .session-manager-menu-item {
    padding: 18.5px 24px;
    color: #777;
    font-size: 16px;
    &:hover {
      background-color: #fbfbfb;
    }
  }
  .session-manager-menu-icon {
    color: #999;
    margin-right: 16px;
  }
`;
