<script setup>
import { inject } from 'vue';
import { SESSION_SYMBOL } from './constants';

const context = inject(SESSION_SYMBOL);
</script>

<template>
  <slot :session="context.session"></slot>
</template>
