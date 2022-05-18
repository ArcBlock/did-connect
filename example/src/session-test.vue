<script setup>
/* eslint-disable no-unused-vars */
import { computed, reactive, ref } from 'vue';

import { SessionManager, SessionProvider, WithSession, Connect } from '@did-connect/vue';
import api from './api';
import FnCom from './fn-com.js';

const serviceHost = computed(() => window.blocklet?.prefix || '/');

const defaultProps = {
  open: false,
  action: 'test',
  content: '',
  params: {},
  messages: {
    title: 'auth.title',
    scan: 'auth.scan',
    confirm: 'auth.confirm',
    success: 'test success',
  },
  counter: 0,
};
const counter = reactive({
  success: 0,
  fail: 0,
  cancel: 0,
});
const onSuccessAuth = (...args) => {
  console.log('onSuccessAuth', ...args);
  state.open = false;
  counter.success++;
};
const onCloseAuth = (...args) => {
  console.log('onCloseAuth', ...args);
  // state.open = false;
  counter.cancel++;
};
const onErrorAuth = (...args) => {
  console.log('onErrorAuth', ...args);
  counter.fail++;
};
const state = reactive(defaultProps);
const type = ref('address');

// setTimeout(() => {
//   type.value = '';
// }, 3000);

function onLogin() {
  console.log('after login');
}
function onLogout() {
  console.log('after logout');
}
</script>

<template>
  <SessionProvider locale="en" :serviceHost="serviceHost" prefix="/api/did">
    <!-- <SessionProvider serviceHost="/abc" prefix="/api/did">
      <WithSession v-slot="{ session }">
        <SessionManager :session="session" @login="onLogin" @logout="onLogout" />
        <div class="bg-gray-200 p-4">
          User Info
          <pre v-if="session.user">{{ JSON.stringify(session.user, null, 2) }}</pre>
        </div>
      </WithSession>
    </SessionProvider> -->
    <WithSession v-slot="{ session }">
      <SessionManager :session="session" @login="onLogin" @logout="onLogout" />
      <template v-if="session.user">
        <div class="w-[200px] h-[100px] p-8">
          <button @click="() => (state.open = true)">启动 did-connect</button>
          <div>
            成功次数：{{ counter.success }}
            <br />
            失败次数：{{ counter.fail }}
            <br />
            关闭次数：{{ counter.cancel }}
          </div>
          <Connect
            popup
            :action="state.action"
            v-model:open="state.open"
            :checkFn="api.get"
            :checkTimeout="5 * 60 * 1000"
            :messages="state.messages"
            @success="onSuccessAuth"
            @error="onErrorAuth"
            @close="onCloseAuth"
          />
        </div>
        <div class="bg-gray-200 p-4">
          User Info
          <pre>{{ JSON.stringify(session.user, null, 2) }}</pre>
        </div>
      </template>
    </WithSession>

    <!-- <FnCom msg="Hi" content="abcdefghijklmnopqrstuvwxyz" /> -->
  </SessionProvider>
</template>
