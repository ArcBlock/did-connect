import { h } from 'vue';
import { NIcon } from 'naive-ui';
import OpenInIcon from '@arcblock/icons/src/icons/open-in.svg?component';
import SessionManager from '../src/components/session-manager';

export default {
  title: 'Components/SessionManager',
  component: SessionManager,
  argTypes: {
    default: {
      control: 'text',
    },
    dark: {
      control: 'boolean',
    },
  },
};

const sessionLogin = {
  user: {
    passports: [{ name: 'admin', title: 'Admin' }],
    did: 'zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV',
    avatar: '/favicon.svg',
    fullName: 'zhanghan',
    role: 'admin',
  },
  logout: (cb) => {
    cb();
    alert('after logout');
  },
};
const sessionNotLogin = {
  user: null,
  login: (cb) => {
    cb();
    alert('after login');
  },
};

function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const customMenus = [
  {
    label: () =>
      h(
        'a',
        {
          href: 'https://www.abtwallet.io/',
          target: '_blank',
          rel: 'noopenner noreferrer',
        },
        '打开钱包-2',
      ),
    key: 'open-in-wallet-2',
    icon: renderIcon(OpenInIcon),
  },
];

const Template = (args) => ({
  components: { SessionManager },
  setup: () => {
    return { args };
  },
  template: `<SessionManager v-bind="args" />`,
});

export const Logined = Template.bind({});
Logined.storyName = 'Has Login';
Logined.args = {
  session: sessionLogin,
  dark: false,
  showRole: true,
  showSwitchDid: true,
  showSwitchProfile: true,
  showSwitchPassport: true,
};

export const NotLogin = Template.bind({});
NotLogin.args = {
  dark: false,
  session: sessionNotLogin,
  size: 28,
  showText: true,
};

export const CustomMenu = Template.bind({});
CustomMenu.args = {
  session: {
    ...sessionLogin,
    user: {
      ...sessionLogin.user,
      avatar: '/not-found.svg',
    },
  },
  menu: customMenus,
};
