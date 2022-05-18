import { reactive } from 'vue';
import useBrowser from '../../../hooks/use-browser';

export default () => {
  const browser = useBrowser();
  const env = reactive({
    isWalletWebview: browser.wallet,
    isMobile: browser.mobile.any,
  });
  return env;
};
