<script setup>
import { computed, onMounted, provide, reactive, unref } from 'vue';
import { useUrlSearchParams } from '@vueuse/core';

import Connect from '../connect';
import useConnect from '../connect/hooks/use-connect';
import useToken from './use-token';
import { getAppId, getPath } from './utils';
import { SESSION_SYMBOL, PREFIX, AUTH_SERVICE_PREFIX } from './constants';
import locales from './locales';
import createService from './service';
import Spinner from '../spinner';

const listeners = { login: [], 'switch-profile': [], 'switch-passport': [] };
const props = defineProps({
  serviceHost: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    default: 'login',
  },
  prefix: {
    type: String,
    default: PREFIX,
  },
  appendAuthServicePrefix: {
    type: Boolean,
    // createAuthServiceSessionContext 中指定的
    default: true,
  },
  locale: {
    type: String,
    default: 'en',
  },
  timeout: {
    type: Number,
    default: 5 * 60 * 1000,
  },
  autoLogin: Boolean,
  extraParams: {
    type: Object,
    default: () => ({}),
  },
  webWalletUrl: {
    type: String,
    default: '',
  },
  engine: {
    type: String,
    default: 'cookie',
    validator: (v) => ['cookie', 'localStorage'].includes(v),
  },
  messages: Object,
});
const { cookieConnectedDid, cookieConnectedPk, cookieConnectedApp, cookieConnectedWalletOs } = useConnect();
const storageToken = useToken({
  engine: unref(props.engine),
  options: {
    path: getPath(),
    returnDomain: false,
  },
});

const fullPrefix = computed(() => {
  if (props.appendAuthServicePrefix) {
    return `${AUTH_SERVICE_PREFIX}${props.prefix}`;
  }
  return props.prefix;
});
const service = createService(props.serviceHost, () => {
  if (['ls', 'localStorage'].includes(unref(props.engine))) {
    return storageToken.value;
  }
  return null;
});

const state = reactive({
  action: props.action,
  error: '',
  initialized: false,
  loading: false,
  open: false,
  user: null,
});

const provideData = computed(() => {
  return {
    api: service,
    session: {
      ...state,
      loading: props.autoLogin ? !state.user || state.loading : state.loading,
      login,
      logout,
      switchDid,
      switchProfile,
      switchPassport,
      refresh,
    },
  };
});
provide(SESSION_SYMBOL, provideData);

const connectMessages = props.messages || locales[props.action];

onMounted(() => {
  const actualApp = getAppId();
  if (unref(cookieConnectedApp) && actualApp && unref(cookieConnectedApp) !== actualApp) {
    clearSession();
    state.initialized = true;
    if (props.autoLogin) {
      state.open = true;
    }
  }

  if (unref(storageToken)) {
    refresh(true, true);
    return;
  }

  if (typeof window !== 'undefined') {
    // If a login token exist in url, set that token in storage
    const params = useUrlSearchParams();
    if (params.loginToken) {
      storageToken.value = params.loginToken;
      refresh(true, true);
      // TODO: 确认设置 null 是否能够删除
      params.loginToken = null;
      return;
    }
  }
  state.initialized = true;
  if (props.autoLogin) {
    state.open = true;
  }
});

async function refresh(showProgress = false, setInitialized = false) {
  try {
    if (state.loading) {
      console.warn('SessionProvider.refresh is currently in progress, call it will be noop');
      return;
    }

    if (showProgress) {
      state.loading = true;
    }

    const { data, status } = await service.get(`${unref(fullPrefix)}/session`.replace(/\/+/, '/'));

    if (status === 400) {
      storageToken.value = null;
      state.user = null;
      state.error = '';
    }

    if (data.error) {
      // Some thing went wrong
      state.open = false;

      state.error = data.error;
    } else if (data.user) {
      // We have valid user
      // this.setState({ open: false, loading: false, ...data });
      // TODO: 确认 assign 是否能赋值给 reactive 对象
      Object.assign(state, data, {
        open: false,
      });
    } else {
      // We may have an invalid token
      storageToken.value = null;
      // TODO: 确认 assign 是否能赋值给 reactive 对象
      Object.assign(state, data, {
        open: props.autoLogin,
        user: null,
      });
      // state.user = null;
    }
  } catch (err) {
    console.error('SessionProvider.refresh error', err);

    state.error = err.message;
    state.open = false;
  } finally {
    if (showProgress) {
      state.loading = false;
    }
    if (setInitialized) {
      state.initialized = true;
    }
  }
}
function login(done) {
  __onSwitch('login', done, true);
}
function logout(done) {
  clearSession(false);
  clearState();
  done();
}
function switchDid(done) {
  clearSession();
  clearState();
  done();
}

function __onSwitch(action, done, needLogin = false) {
  if (!needLogin && !state.user) {
    return;
  }
  if (typeof done === 'function') {
    listeners[action].push(done);
  }
  state.open = true;
  state.action = action;
}

function switchProfile(done) {
  __onSwitch('switch-profile', done);
}

function switchPassport(done) {
  __onSwitch('switch-passport', done);
}
async function onLogin(result, decrypt) {
  const { loginToken, sessionToken } = result;
  const token = loginToken || sessionToken;
  if (token) {
    storageToken.value = decrypt(token);
    state.loading = false;
    await refresh(true);
    while (listeners.login.length > 0) {
      const cb = listeners.login.shift();
      try {
        cb(result, decrypt);
      } catch (err) {
        console.error('Error when call login listeners', err);
      }
    }
  }
}
function onSwitchProfile() {
  state.loading = false;
  refresh(true);
}
function onClose(action) {
  state.open = false;
  listeners[action] = [];
}
function onSuccess(action, ...args) {
  const callbacks = {
    login: onLogin,
    'switch-profile': onSwitchProfile,
    'switch-passport': onLogin,
  };
  callbacks[action] && callbacks[action](...args);
}

function clearState() {
  state.user = null;
  state.error = '';
  state.open = false;
  state.loading = false;
}
function clearSession(clearAll = true) {
  cookieConnectedApp.value = null;
  cookieConnectedWalletOs.value = null;
  storageToken.value = null;
  if (clearAll) {
    cookieConnectedPk.value = null;
    cookieConnectedDid.value = null;
  }
}
</script>

<template>
  <Spinner v-if="!state.initialized" mode="fullscreen" />
  <template v-else>
    <slot></slot>
    <Connect
      popup
      v-model:open="state.open"
      :action="state.action"
      :locale="props.locale"
      :checkFn="service.get"
      :extraParams="props.extraParams"
      :checkTimeout="props.timeout"
      :webWalletUrl="props.webWalletUrl"
      :messages="connectMessages[props.locale]"
      :prefix="fullPrefix"
      @close="(...args) => onClose(state.action, ...args)"
      @success="(...args) => onSuccess(state.action, ...args)"
    />
  </template>
</template>
