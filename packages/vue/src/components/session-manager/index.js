import { computed, defineComponent, h, unref } from 'vue';
import SessionManager from './session-manager.vue';
import SessionManagerLogin from './session-manager-login.vue';

export default defineComponent({
  props: {
    session: {
      type: Object,
      required: true,
    },
  },
  setup(props, { attrs, slots }) {
    return () => {
      const Com = computed(() => (props.session?.user ? SessionManager : SessionManagerLogin));

      return h(
        unref(Com),
        {
          ...attrs,
          session: props.session,
        },
        slots
      );
    };
  },
});
