<script setup></script>
<template>
  <div class="base-card">
    <slot></slot>
  </div>
</template>

<style lang="less" scoped>
.base-card {
  display: inline-block;
  padding: 16px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background-color: #fff;
  /* safari 圆角问题, https://stackoverflow.com/questions/49066011/overflow-hidden-with-border-radius-not-working-on-safari */
  transform: translateZ(0);
}
</style>
