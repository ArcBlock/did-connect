import { defineComponent, h } from 'vue';
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
    const Com = props.session?.user ? SessionManager : SessionManagerLogin;
    return () =>
      h(
        Com,
        {
          ...attrs,
          session: props.session,
        },
        slots,
      );
  },
});
