<script setup>
import { ref, unref, computed } from 'vue';
import { Shape } from '@arcblock/did-motif';
import { NAvatar } from 'naive-ui';

import DIDMotif from './did-motif.vue';
import { isEthereumDid } from './utils';
import blockies from './etherscan-blockies';

const props = defineProps({
  did: {
    type: String,
    required: true,
  },
  src: {
    type: String,
  },
  size: {
    type: Number,
    default: 36,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['circle', 'rounded', 'default'].includes(v),
  },
  animation: {
    type: Boolean,
    default: false,
  },
  responsive: {
    type: Boolean,
    default: false,
  },
  shape: {
    type: String,
    default: '',
    validator: (v) => ['', 'rectangle', 'square', 'hexagon', 'circle'].includes(v),
  },
});

const computedShape = computed(() => Shape[(props.shape || '').toUpperCase()]);
const computedDid = computed(() => props.did.replace('did:abt:', ''));
const blockyIcon = computed(() => {
  if (isEthereumDid(props.did)) {
    return blockies
      .createIcon({
        seed: unref(computedDid).toLowerCase(),
        size: 8,
        scale: 16,
      })
      .toDataURL();
  }
  return null;
});
const avatarRound = computed(() => {
  if (props.variant === 'rounded') {
    return false;
  }
  if (props.variant === 'circle') {
    return true;
  }
  return false;
});
const loadImgError = ref(false);
</script>

<template>
  <NAvatar
    v-if="props.src && !loadImgError"
    color="transparent"
    :size="props.size"
    :round="avatarRound"
    :title="props.did"
    :src="props.src"
    :style="{
      'border-radius': props.variant === 'rounded' ? '4px' : '',
    }"
    :on-error="
      () => {
        loadImgError = true;
      }
    "
  />

  <div
    v-else-if="blockyIcon"
    class="blocky-icon__container"
    :style="{
      width: `${props.size / 0.7}px`,
      height: `${props.size}px`,
      'border-radius': `${Math.min(10, Math.floor(0.1 * props.size + 2))}px`,
    }"
  >
    <NAvatar
      color="transparent"
      :size="props.size"
      :src="blockyIcon"
      :round="avatarRound"
      :title="props.did"
      :style="{
        'border-radius': props.variant === 'round' ? '4px' : '',
      }"
    />
  </div>

  <template v-else>
    <DIDMotif
      :did="computedDid"
      :size="props.size"
      :animation="props.animation"
      :shape="computedShape"
      :responsive="props.responsive"
    />
  </template>
</template>

<style scoped>
.blocky-icon__container {
  display: flex;
  justify-content: center;
  padding: 2px 0;
  overflow: hidden;

  text-align: center;
  background: #ddd;
}
</style>
