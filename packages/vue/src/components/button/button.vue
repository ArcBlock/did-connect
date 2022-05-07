<script setup>
import ConnectLogo from '@arcblock/icons/src/icons/connect-logo.svg?component';
const props = defineProps({
  color: {
    type: String,
    default: 'did',
  },
  size: {
    type: [String, Number],
    default: 'default',
    validator: (v) => !isNaN(v) || ['x-small', 'small', 'default', 'large', 'x-large'].includes(v),
  },
});
</script>

<template>
  <v-btn flat :color="props.color" :size="props.size" class="flex items-center">
    <span class="font-400">
      <slot>Continue With</slot>
    </span>
    <ConnectLogo class="h-[1.2em] w-auto mr-[4px] ml-[8px]" />
  </v-btn>
</template>
