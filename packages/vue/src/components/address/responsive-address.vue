<script>
import { computed, ref, unref, defineComponent, h } from 'vue';
import Address from './address.vue';
import Container from '../container';

const addressRef = ref(null);

const initialWidth = computed(() => {
  return unref(unref(addressRef)?.initialWidth) || 0;
});

function getCompact(containerWidth = 0) {
  console.log(unref(initialWidth));
  return containerWidth - unref(initialWidth) < 0;
}

export default defineComponent({
  setup(props, { attrs, slots }) {
    return () =>
      h(
        Container,
        {
          class: 'did-address__wrapper',
          ref: attrs.ref,
        },
        (slotProps) => {
          return h(
            Address,
            {
              ...attrs,
              ref: addressRef,
              compact: attrs.compact || getCompact(slotProps.width),
            },
            slots,
          );
        },
      );
  },
});
</script>

<style scoped>
.did-address__wrapper :deep(.did-address__truncate) {
  overflow: visible;
  text-overflow: unset;
}
</style>
