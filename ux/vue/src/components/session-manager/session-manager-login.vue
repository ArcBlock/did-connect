<script setup>
import { computed } from 'vue';
import { NButton } from 'naive-ui';
import locales from './locales';

const props = defineProps({
  locale: {
    type: String,
    validator: (v) => ['en', 'zh'].includes(v),
    default: 'en',
  },
  session: {
    type: Object,
    required: true,
  },
  size: {
    type: Number,
    default: 28,
  },
  dark: Boolean,
  showText: Boolean,
});
const emits = defineEmits(['login']);

function login() {
  props.session.login(() => {
    emits('login');
  });
}

const computedStyles = computed(() => {
  if (props.showText) {
    return {};
  }
  return {
    width: `${props.size * 2}px`,
    height: `${props.size * 2}px`,
  };
});
</script>

<template>
  <NButton
    quaternary
    :round="showText"
    :circle="!showText"
    size="large"
    :class="{
      'did-session-manage__icon-button': true,
      [`did-session-manage__icon-button--${showText ? 'round' : 'circle'}`]: true,
      dark: props.dark,
    }"
    :style="computedStyles"
    @click="login"
  >
    <i
      class="did-session-manage__icon !dark:text-[#fff] text-xl i-mdi:account-outline"
      :style="`font-size: ${showText ? '24px' : `${props.size * 1.14286}px`}`"
    />
    <template v-if="showText">
      <span class="ml-1 dark:text-[#fff]">{{ locales[props.locale].connect.toUpperCase() }}</span>
    </template>
  </NButton>
</template>

<style scoped>
.did-session-manage__icon-button :deep(.n-button__content) {
  width: auto;
}
.did-session-manage__icon {
  color: rgba(0, 0, 0, 0.54);
}
.did-session-manage__icon-button--round {
  border: 1px solid rgba(0, 0, 0, 0.23);
  height: 38px;
}
.did-session-manage__icon-button--round.dark {
  border-color: #fff;
}
</style>
