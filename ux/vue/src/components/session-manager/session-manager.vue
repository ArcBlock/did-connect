<script setup>
import { ref, computed, h } from 'vue';
import { NPopover, NMenu, NTag, NButton, NIcon } from 'naive-ui';
import SwitchDidIcon from '@arcblock/icons/src/icons/switch.svg?component';
import OpenInIcon from '@arcblock/icons/src/icons/open-in.svg?component';
import DisconnectIcon from '@arcblock/icons/src/icons/disconnect.svg?component';

import Avatar from '../avatar';
import Address from '../address';
import COLORS from '../../constants/colors';
import locales from './locales';
import { localeProp } from '../../libs/props';

const props = defineProps({
  session: {
    type: Object,
    required: true,
  },
  locale: localeProp,
  showText: Boolean,
  showRole: Boolean,
  showSwitchDid: Boolean,
  showSwitchProfile: {
    type: Boolean,
    default: true,
  },
  showSwitchPassport: {
    type: Boolean,
    default: true,
  },
  disableLogout: Boolean,
  menu: {
    type: Array,
    default: () => [],
  },
  dark: Boolean,
  size: {
    type: Number,
    default: 28,
  },
});
const emits = defineEmits(['logout', 'switch-profile', 'switch-did', 'switch-passport']);
const popoverRef = ref(null);

const avatar = computed(() => props.session.user?.avatar?.replace(/\s/g, encodeURIComponent(' ')));
function renderIcon(icon) {
  return () => h(NIcon, null, { default: () => h(icon) });
}
function logout(closeCallback) {
  props.session.logout((...args) => {
    closeCallback();
    emits('logout', ...args);
  });
}
function switchProfile(closeCallback) {
  props.session.switchProfile((...args) => {
    closeCallback();
    emits('switch-profile', ...args);
  });
}
function switchDid(closeCallback) {
  props.session.switchDid((...args) => {
    closeCallback();
    emits('switch-did', ...args);
  });
}
function switchPassport(closeCallback) {
  props.session.switchPassport((...args) => {
    closeCallback();
    emits('switch-passport', ...args);
  });
}

const computedMenu = computed(() => {
  const menuOptions = [...props.menu];

  menuOptions.push({
    label: () =>
      h(
        'a',
        {
          href: 'https://www.abtwallet.io/',
          target: '_blank',
          rel: 'noopenner noreferrer',
        },
        locales[props.locale].openInWallet
      ),
    key: 'open-in-wallet',
    icon: renderIcon(OpenInIcon),
  });
  if (props.showSwitchDid) {
    menuOptions.push({
      label: locales[props.locale].switchDid,
      key: 'switch-did',
      icon: renderIcon(SwitchDidIcon),
      onClick: () => {
        switchDid(closePopover);
      },
    });
  }
  if (props.showSwitchProfile) {
    menuOptions.push({
      label: locales[props.locale].switchProfile,
      key: 'switch-profile',
      icon: () =>
        h('i', {
          class: 'i-mdi:person-outline',
          style: {
            transform: 'scale(1.15)',
          },
        }),
      onClick: () => {
        switchProfile(closePopover);
      },
    });
  }
  if (props.showSwitchPassport) {
    menuOptions.push({
      label: locales[props.locale].switchPassport,
      key: 'switch-passport',
      icon: () =>
        h('i', {
          class: 'i-mdi:key-outline',
        }),
      onClick: () => {
        switchPassport(closePopover);
      },
    });
  }
  menuOptions.push({
    label: locales[props.locale].disconnect,
    key: 'disconnect',
    icon: renderIcon(DisconnectIcon),
    disabled: props.disableLogout,
    onClick: () => {
      logout(closePopover);
    },
  });
  return menuOptions;
});

function handleUpdateValue(key, item) {
  if (!(item.onClick instanceof Function)) {
    closePopover();
  }
}

function closePopover() {
  popoverRef.value.setShow(false);
}

const computedRole = computed(() => {
  return (
    props.session.user?.passports?.find((item) => item.name === props.session.user.role)?.title ||
    props.session.user?.role.toUpperCase()
  );
});
</script>

<template>
  <NPopover
    ref="popoverRef"
    trigger="click"
    :show-arrow="false"
    :class="{
      'did-session-manager': true,
      dark: props.dark,
    }"
  >
    <template #trigger>
      <NButton
        quaternary
        circle
        :style="{
          width: `${props.size * 2}px`,
          height: `${props.size * 2}px`,
          overflow: 'hidden',
        }"
      >
        <Avatar variant="circle" shape="circle" :src="avatar" :size="props.size * 1.2" :did="props.session.user.did" />
      </NButton>
    </template>
    <div class="did-session-manager__info">
      <div class="flex justify-between items-center mb-1">
        <span
          class="did-session-manager__username font-bold text-[#222] dark:text-[#aaa] flex justify-between item-center"
          style="font-size: 20px"
        >
          {{ props.session.user.fullName }}
        </span>
        <NTag
          v-if="props.showRole && computedRole"
          round
          size="small"
          class="did-session-manager__role-tag !bg-transparent"
          style="font-size: 0.9em"
        >
          {{ computedRole }}
          <template #avatar>
            <i
              class="ml-1 i-mdi:shield-check"
              :style="{
                fontSize: '1.2em',
                color: COLORS.SUCCESS,
              }"
            ></i>
          </template>
        </NTag>
      </div>
      <Address :dark="props.dark" :responsive="false" :locale="props.locale" :content="props.session.user.did" />
    </div>
    <NMenu :root-indent="12" :icon-size="24" :options="computedMenu" @update:value="handleUpdateValue" />
  </NPopover>
</template>

<style scoped>
.did-session-manager__info {
  padding: 14px 24px 0px;
}
</style>
<style>
.n-popover.did-session-manager {
  padding: 0 !important;
  border-radius: 16px;
  max-width: calc(100vw - 10px);
  box-shadow: 0px 8px 12px rgb(92 92 92 / 4%);
  border: 1px solid #f0f0f0;
}
.n-popover.did-session-manager.dark {
  background-color: #27282c;
  border: none;
}
.n-popover.did-session-manager.dark .did-session-manager__role-tag {
  color: #aaa;
}
.n-popover.did-session-manager .n-menu {
  padding: 0 !important;
}
.n-popover.did-session-manager .n-menu-item {
  height: auto;
  margin: 0;
}
.n-popover.did-session-manager .n-menu-item:last-child .n-menu-item-content:hover::before {
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
}
.n-popover.did-session-manager .n-menu-item-content {
  padding: 0;
  color: #777;
  font-size: 16px;
  padding: 15px 24px !important;
  height: auto;
}
.n-popover.did-session-manager.dark .n-menu-item-content {
  color: #aaa;
}
.n-popover.did-session-manager .n-menu-item-content::before {
  left: 0px;
  right: 0px;
}
.n-popover.did-session-manager.dark .n-menu-item-content:hover::before {
  background-color: #363434;
}
.n-popover.did-session-manager .n-menu-item-content .n-menu-item-content__icon {
  margin-right: 16px !important;
}
.n-popover.did-session-manager .n-menu-item-content .n-menu-item-content__icon,
.n-popover.did-session-manager .n-menu-item-content .n-menu-item-content-header,
.n-popover.did-session-manager .n-menu-item-content .n-menu-item-content-header a {
  color: inherit !important;
}
</style>
