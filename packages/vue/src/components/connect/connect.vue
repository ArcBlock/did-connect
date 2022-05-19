<script setup>
import { computed } from 'vue';
import { pick, omit } from 'lodash-es';
import { PREFIX } from '../session/constants';
import useSessionState from './hooks/use-session-state';
import BasicConnect from './basic-connect.vue';

const props = defineProps({
  action: {
    type: String,
    required: true,
  },
  checkFn: {
    type: Function,
    required: true,
  },
  prefix: {
    type: String,
    default: PREFIX,
  },
  socketUrl: String,
  checkInterval: {
    type: Number,
    default: 2000,
  },
  checkTimeout: {
    type: Number,
    default: 60 * 1000,
  },
  extraParams: {
    type: Object,
    default: () => ({}),
  },
  locale: {
    type: String,
    default: 'en',
    validator: (v) => ['en', 'zh'].includes(v),
  },
  tokenKey: {
    type: String,
    default: '_t_',
  },
  encKey: {
    type: String,
    default: '_ek_',
  },
  baseUrl: String,
  enableAutoConnect: {
    type: Boolean,
    default: true,
  },
  open: {
    type: Boolean,
    default: false,
  },
  enabledConnectTypes: {
    type: Array,
    default: () => ['web', 'mobile'],
  },
  webWalletUrl: {
    type: String,
    default: '',
  },
  showDownload: {
    type: Boolean,
    default: true,
  },
  qrcodeSize: {
    type: Number,
    default: 184,
  },
  messages: {
    type: Object,
    required: true,
  },
});
const emits = defineEmits(['success', 'close', 'error', 'recreateSession']);

if (typeof props.checkFn !== 'function') {
  throw new Error('Cannot initialize did connect component without a fetchFn');
}

const { state, generate, cancelWhenScanned } = useSessionState({
  ...pick(props, [
    'action',
    'baseUrl',
    'checkFn',
    'checkInterval',
    'checkTimeout',
    'prefix',
    'extraParams',
    'locale',
    'tokenKey',
    'encKey',
    'socketUrl',
    'enableAutoConnect',
    'open',
  ]),
  onClose(...args) {
    emits('close', ...args);
  },
  onError(...args) {
    emits('error', ...args);
  },
  onSuccess(...args) {
    emits('success', ...args);
  },
});

const connectProps = computed(() => {
  return {
    state,
    generate,
    cancelWhenScanned,
    ...omit(props, [
      'action',
      'baseUrl',
      'open',
      'prefix',
      'socketUrl',
      'checkFn',
      'checkInterval',
      'checkTimeout',
      'extraParams',
      'enableAutoConnect',
    ]),
  };
});
</script>

<template>
  <BasicConnect v-if="props.open" v-bind="connectProps" />
</template>
