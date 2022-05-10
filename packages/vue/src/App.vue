<script setup>
import { Address, Avatar, Button, Logo, SessionManager } from './components';

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
function onLogout(...args) {
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
  <!-- <Address :inline="false" :responsive="false">
    <template #prepend> prepend:: </template>
    <template #append> ::append </template>
    <router-link to="https://www.arcblock.io">abcdefghijklmnopqrstuvwxyz</router-link>
  </Address> -->
  <!-- <div style="display: flex; justify-content: center">
    <Avatar did="zysiVRb5pSUPGcitPepiz4Pm5SpQ2EtgejMV" />
    <Avatar did="0x8d75FD337071AdcC22B9c7D7C0ccff2e5aaCB112" />
    <Avatar src="/favicon.ico" did="0x8d75FD337071AdcC22B9c7D7C0ccff2e5aaCB112" />
  </div>
  <br />
  <div>
    <Button />
  </div>
  <br />
  <div>
    <Logo :size="60" />
  </div> -->
</template>

<style></style>
