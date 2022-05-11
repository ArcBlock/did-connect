<script setup>
import { ref } from 'vue';
import { useElementSize } from '@vueuse/core';

const containerRef = ref(null);

const { width } = useElementSize(containerRef);
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
