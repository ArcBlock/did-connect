import { inject } from 'vue';
import { SESSION_SYMBOL } from './constants';

export default function useSession() {
  const context = inject(SESSION_SYMBOL);
  return context.value.session;
}
