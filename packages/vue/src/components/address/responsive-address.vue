<script setup>
import { computed, ref, unref } from 'vue';
import Address from './address.vue';
import Container from '../container';

const props = defineProps({
  compact: Boolean,
  content: String,
});
const addressRef = ref(null);

const initialWidth = computed(() => {
  return unref(unref(addressRef)?.initialWidth) || 0;
});

function getCompact(containerWidth = 0) {
  return containerWidth - unref(initialWidth) < 0;
}
</script>

<template>
  <Container class="did-address__wrapper">
    <template v-slot="{ width }">
      <Address ref="addressRef" :content="props.content" :compact="props.compact || getCompact(width)" />
    </template>
  </Container>
</template>

<style scoped>
.did-address__wrapper :deep(.did-address__truncate) {
  overflow: visible;
  text-overflow: unset;
}
</style>
