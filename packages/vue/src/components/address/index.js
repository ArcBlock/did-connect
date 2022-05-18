import { defineComponent, h, mergeProps } from 'vue';
import Address from './address.vue';
import ResponsiveAddress from './responsive-address.vue';

export default defineComponent({
  name: 'AddressWrapper',
  props: {
    responsive: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { attrs, slots }) {
    return () => {
      if (props.responsive) {
        return h(ResponsiveAddress, attrs, slots);
      }
      return h(
        Address,
        mergeProps(
          attrs,
          attrs.inline
            ? {
                style: 'max-width: 100%',
              }
            : {}
        ),
        slots
      );
    };
  },
});
