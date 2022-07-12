<script setup>
import BaseCard from './base-card.vue';

const props = defineProps({
  layout: {
    type: String,
    default: 'tb',
    validator: (v) => ['lr', 'tb'].includes(v),
  },
});
</script>

<template>
  <BaseCard :class="`responsive-card responsive-card--${props.layout}`">
    <slot></slot>
  </BaseCard>
</template>

<style lang="less" scoped>
.responsive-card {
  display: flex;
  justify-content: space-between;
  & > :deep(div) {
    flex: 0 0 auto;
  }
}
.responsive-card--lr {
  flex-direction: row;
  & > :deep(div) {
    align-self: center;
  }
  & > :deep(div:first-child) {
    flex-shrink: 1;
    min-width: 80px;
    margin-right: 8px;
  }
}
.responsive-card--tb {
  flex-direction: column;
  /* web wallet provider 内容可能比较长, 窄屏下需要支持 shrink, 并且与右边的 icon 保持间距 */
}
</style>
