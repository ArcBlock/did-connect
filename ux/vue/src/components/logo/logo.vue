<script setup>
import DidLogoIcon from '@arcblock/icons/src/icons/did-logo.svg?component';

const props = defineProps({
  size: {
    type: [Number, String],
    default: 0,
  },
});
const height = Number(props.size) > 0 ? `${Number(props.size)}px` : props.size;
</script>

<template>
  <DidLogoIcon
    :style="{
      width: 'auto',
      fill: 'currentColor',
      height: height || '1em',
    }"
  />
</template>
