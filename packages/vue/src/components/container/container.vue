<script setup>
import { ref } from 'vue';
import { useResizeObserver } from '@vueuse/core';

const containerRef = ref(null);
const width = ref(0);

useResizeObserver(containerRef, ([entry]) => {
  width.value = entry.contentRect.width;
});
</script>

<template>
  <div ref="containerRef" class="did-container">
    <slot :width="width"></slot>
  </div>
</template>

<style scoped>
.did-container {
  display: inline-block;
  width: 100%;
  overflow: hidden;
}
</style>
