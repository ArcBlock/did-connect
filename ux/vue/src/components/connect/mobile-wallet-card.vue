<script setup>
import ResponsiveCard from './responsive-card.vue';
import useConnectUtils from './hooks/use-connect-utils';
import QrCode from '../qr-code';
import RefreshOverlay from './refresh-overlay.vue';
import { connectLayoutProp } from '../../libs/props';

const props = defineProps({
  tokenState: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
  },
  qrcodeSize: {
    type: Number,
    required: true,
  },
  layout: connectLayoutProp,
});
const { isTimeout } = useConnectUtils(props.tokenState);
</script>

<template>
  <ResponsiveCard class="mobile-wallet-card" :status="props.status" :layout="props.layout">
    <div>
      <div class="mobile-wallet-card__title">Mobile Wallet</div>
    </div>
    <QrCode :data="props.tokenState.url" :size="props.qrcodeSize" />
    <RefreshOverlay v-if="isTimeout" @refresh="emits('refresh')" />
  </ResponsiveCard>
</template>

<style lang="less" scoped>
.mobile-wallet-card {
  position: relative;
  color: #a8b4c5;
  font-weight: 700;
}
.mobile-wallet-card__title {
  margin-top: 0.125rem;
  font-size: 20px;
  color: #666;
}
</style>
