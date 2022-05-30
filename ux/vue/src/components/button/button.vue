<script setup>
import ConnectLogo from '@arcblock/icons/src/icons/connect-logo.svg?component';
import BaseButton from './base-button.vue';
</script>

<template>
  <BaseButton v-bind="$attrs" color="did">
    <span class="font-400">
      <slot>Continue With</slot>
    </span>
    <ConnectLogo class="h-[1.2em] w-auto mr-[4px] ml-[8px]" />
  </BaseButton>
</template>
