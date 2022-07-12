import { computed, unref } from 'vue';

export default (state) => {
  const isTimeout = computed(() => unref(state).status === 'timeout');

  return { isTimeout };
};
