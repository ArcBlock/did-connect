<script setup>
import { computed, unref } from 'vue';
import { useWindowSize } from '@vueuse/core';
import { NDrawer, NDrawerContent } from 'naive-ui';

const props = defineProps({
  show: Boolean,
  placement: {
    type: String,
    default: 'bottom',
    validator: (v) => ['left', 'right', 'top', 'bottom'].includes(v),
  },
});
const emits = defineEmits(['update:show']);
const { width } = useWindowSize();
const isSmallScreen = computed(() => {
  return unref(width) < 768;
});

function onUpdateShow(...args) {
  emits('update:show', ...args);
}
</script>

<template>
  <NDrawer
    class="did-connect__drawer"
    :height="`${isSmallScreen ? 'calc(100vh - 44px)' : '780px'}`"
    :width="`${isSmallScreen ? '100%' : '720px'}`"
    :show="props.show"
    :placement="isSmallScreen ? props.placement : 'center'"
    :on-update:show="onUpdateShow"
  >
    <NDrawerContent v-show="props.show">
      <i class="did-connect__drawer-close i-mdi:close" @click="() => onUpdateShow(false)"></i>
      <slot></slot>
    </NDrawerContent>
  </NDrawer>
</template>

<style lang="less">
.n-drawer.did-connect__drawer {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
  &.n-drawer--center-placement {
    margin: auto;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    width: auto;
    border-radius: 4px;
  }
  .did-connect__drawer-close {
    position: absolute;
    top: 0.7rem;
    right: 0.7rem;
    z-index: 1;
    // color: rgb(68, 68, 68);
    font-size: 1.8rem;
    line-height: 1;
    cursor: pointer;
    user-select: none;
  }
  .n-drawer-content {
    .n-drawer-body-content-wrapper {
      padding: 0;
    }
  }
}
</style>
