<script setup>
import { ref } from 'vue';
import { NSpin } from 'naive-ui';
import colors from '@arcblock/ux/lib/Colors';

const wrapperRef = ref(null);

const props = defineProps({
  loading: {
    type: Boolean,
    default: true,
  },
  appendToBody: Boolean,
  mode: {
    type: String,
    default: 'default',
    validator: (v) => ['fullscreen', 'default'].includes(v),
  },
  size: {
    type: [String, Number],
    default: 'medium',
  },
});
</script>

<template>
  <Teleport v-if="props.mode === 'fullscreen'" to="body" :disabled="!props.appendToBody">
    <div ref="wrapperRef" class="spinner__wrapper--fullscreen"></div>
  </Teleport>
  <template v-if="props.mode === 'default' || wrapperRef">
    <Teleport :to="wrapperRef" :disabled="props.mode === 'default'">
      <NSpin
        :show="props.loading"
        class="did-connect__spinner"
        :stroke="colors.did.primary"
        :size="props.size"
        :style="{
          '--n-color': colors.did.primary,
          '--n-text-color': colors.did.primary,
        }"
      >
        <slot></slot>
        <template #description v-if="$slots.description">
          <slot name="description"></slot>
        </template>
        <template #icon v-if="$slots.icon">
          <slot name="icon"></slot>
        </template>
      </NSpin>
    </Teleport>
  </template>
</template>

<style lang="less" scoped>
.spinner__wrapper--fullscreen {
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  min-width: 160px;
  min-height: 160px;
  height: 100%;
  width: 100%;
}
.did-connect__spinner :deep(.n-spin) {
  --n-color: inherit !important;
  --n-text-color: inherit !important;
}
</style>
