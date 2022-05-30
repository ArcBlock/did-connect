<script setup>
import { SessionManager } from './components';

const session = {
  user: {
    did: 'zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV',
    avatar: '/favicon.svg',
    fullName: 'zhanghan',
    role: 'Admin',
  },
  login: (cb) => {
    cb();
  },
  logout: (cb) => {
    cb();
  },
};

function onLogin() {
  alert('after login');
}
function onLogout() {
  alert('after logout');
}
</script>

<template>
  <SessionManager
    :session="session"
    show-role
    :show-text="false"
    @login="onLogin"
    @logout="onLogout"
    dark
    disableLogout
  />
</template>
