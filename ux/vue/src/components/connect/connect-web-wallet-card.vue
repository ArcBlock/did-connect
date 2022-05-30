<script setup>
import { computed } from 'vue';
import ComputerIcon from '@arcblock/icons/src/icons/computer.svg?component';

import RefreshOverlay from './refresh-overlay.vue';
import ResponsiveCard from './responsive-card.vue';
import useConnectUtils from './hooks/use-connect-utils';
import { connectLayoutProp } from '../../libs/props';

const props = defineProps({
  tokenState: {
    type: Object,
    required: true,
  },
  webWalletUrl: String,
  layout: connectLayoutProp,
});
const { isTimeout } = useConnectUtils(props.tokenState);
const emits = defineEmits(['refresh']);
const iconSize = computed(() => (props.layout === 'lr' ? 48 : 64));
const webWalletExtension = window?.ABT_DEV || window.ABT;
const showWalletExtension = computed(() => webWalletExtension && typeof webWalletExtension.open === 'function');
const url = new URL(props.webWalletUrl);
</script>

<template>
  <ResponsiveCard class="connect-web-wallet-card__wrapper" :layout="props.layout">
    <div>
      <div class="connect-web-wallet-card__title">Web Wallet</div>
      <div v-if="showWalletExtension || props.webWalletUrl" class="connect-web-wallet-card__desc">
        {{ showWalletExtension ? 'Web Wallet Extension' : url.hostname }}
      </div>
    </div>
    <ComputerIcon
      :style="{
        width: iconSize,
        height: iconSize,
      }"
    />

    <RefreshOverlay v-if="isTimeout" @refresh="emits('refresh')" />
  </ResponsiveCard>
</template>

<style lang="less" scoped>
.connect-web-wallet-card__wrapper {
  color: #a8b4c5;
  background-color: #fff;
  font-weight: 700;
  position: relative;
  cursor: pointer;
  &:not(.card_timeout):hover {
    background-color: #f2f8ff;
    svg {
      color: #4598fa;
    }
  }
}
.connect-web-wallet-card__title {
  margin-top: 0.25rem;
  color: #666;
  font-size: 20px;
}
.connect-web-wallet-card__desc {
  margin-top: 0.25rem;
  font-size: 12px;
  word-break: break-all;
}
</style>
