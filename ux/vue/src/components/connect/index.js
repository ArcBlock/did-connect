import { defineComponent, h } from 'vue';

import Connect from './connect.vue';
import Modal from '../modal';

export default defineComponent({
  props: {
    popup: Boolean,
    open: Boolean,
  },
  setup(props, { attrs, slots, emit }) {
    return () => {
      if (props.popup) {
        return h(
          Modal,
          {
            show: props.open,
            'onUpdate:show': (...args) => {
              emit('update:open', ...args);
            },
          },
          () => h(Connect, { ...attrs, open: true }, slots)
        );
      }
      return h(Connect, { ...attrs, open: props.open }, slots);
    };
  },
});

export { default as BasicConnect } from './basic-connect.vue';
