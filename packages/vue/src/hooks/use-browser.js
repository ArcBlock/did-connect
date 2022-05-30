import isMobile from 'ismobilejs';
import { reactive } from 'vue';

export default function useBrowser() {
  const browser = reactive({
    wallet: navigator.userAgent.indexOf('ABTWallet') > -1,
    wechat: /MicroMessenger/i.test(navigator.userAgent),
    mobile: {
      apple: {
        phone: false,
        ipod: false,
        tablet: false,
        device: false,
      },
      amazon: {
        phone: false,
        tablet: false,
        device: false,
      },
      android: {
        phone: false,
        tablet: false,
        device: false,
      },
      windows: {
        phone: false,
        tablet: false,
        device: false,
      },
      other: {
        blackberry: false,
        blackberry10: false,
        opera: false,
        firefox: false,
        chrome: false,
        device: false,
      },
      phone: false,
      tablet: false,
      any: false,
      ...isMobile(navigator.userAgent),
    },
  });

  return browser;
}
