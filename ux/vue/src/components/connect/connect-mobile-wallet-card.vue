<script setup>
import { computed, unref } from 'vue';
import MobileIcon from '@arcblock/icons/src/icons/mobile.svg?component';

import useConnectUtils from './hooks/use-connect-utils';
import RefreshOverlay from './refresh-overlay.vue';
import ResponsiveCard from './responsive-card.vue';
import { connectLayoutProp } from '../../libs/props';

const props = defineProps({
  tokenState: {
    type: Object,
    required: true,
  },
  deepLink: {
    type: String,
    required: true,
  },
  layout: connectLayoutProp,
});

const { isTimeout } = useConnectUtils(props.tokenState);
const iconSize = computed(() => (props.layout === 'lr' ? [20, 34] : [40, 68]));
const width = computed(() => `${unref(iconSize)[0]}px`);
const height = computed(() => `${unref(iconSize)[1]}px`);
function onClick() {
  const aLink = document.createElement('a');
  aLink.href = props.deepLink;
  aLink.click();
}
</script>

<template>
  <ResponsiveCard class="connect-mobile-wallet-card__wrapper" :layout="props.layout" @click="onClick">
    <div>
      <div class="connect-mobile-wallet-card__title">Open In</div>
      <div class="connect-mobile-wallet-card__desc">Mobile Wallet</div>
    </div>
    <MobileIcon :style="{ width, height }" />
    <RefreshOverlay v-if="isTimeout" @refresh="emits('refresh')" />
  </ResponsiveCard>
</template>

<style lang="less" scoped>
.connect-mobile-wallet-card__wrapper {
  color: #a8b4c5;
  position: relative;
  cursor: pointer;
  font-weight: 700;
}
.connect-mobile-wallet-card__title {
  font-size: 16px;
}
.connect-mobile-wallet-card__desc {
  font-size: 20px;
  margin-top: 0.125rem;
  color: #334660;
}
</style>
