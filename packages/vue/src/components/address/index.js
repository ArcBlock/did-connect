import { defineComponent, h, mergeProps } from 'vue';
import Address from './address.vue';
import ResponsiveAddress from './responsive-address.vue';

// export default function DidAddress(props, { slots, attrs }) {
//   const Com = props.responsive ? ResponsiveAddress : Address;
//   return h(Com, attrs, slots);
// }
// DidAddress.props = {
//   responsive: Boolean,
// };

export default defineComponent({
  props: {
    responsive: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, { attrs, slots }) {
    if (props.responsive) {
      return () => h(ResponsiveAddress, attrs, slots);
    }
    return () =>
      h(
        Address,
        mergeProps(
          attrs,
          attrs.inline
            ? {
                style: 'max-width: 100%',
              }
            : {},
        ),
        slots,
      );
  },
});
