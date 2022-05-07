<script setup>
import { ref, onMounted } from 'vue';
import { update } from '@arcblock/did-motif';

const props = defineProps({
  did: {
    type: String,
    required: true,
  },
  responsive: {
    type: Boolean,
    default: false,
  },
  size: {
    type: Number,
    default: 200,
  },
  animation: {
    type: Boolean,
    default: false,
  },
  shape: {
    type: String,
    default: '',
    validator: (v) => ['', 'rectangle', 'square', 'hexagon', 'circle'].includes(v),
  },
});
const svgRef = ref(null);

onMounted(() => {
  update(svgRef.value, props.did, { size: props.size, animation: props.animation, shape: props.shape });
});
</script>

<template>
  <!-- fix avatar 显示问题 (safari 下父容器为 flex 时 inline svg 显示不出来, 需要明确指定 width) -->
  <svg v-if="props.responsive" ref="svgRef" style="width: 100%; max-height: 100%" />
  <span
    v-else
    :style="{
      display: 'inline-block',
      width: `${props.size}px`,
      height: `${props.size}px`,
    }"
  >
    <svg ref="svgRef" />
  </span>
</template>
