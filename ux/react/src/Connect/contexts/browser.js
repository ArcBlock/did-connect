import React, { useContext } from 'react';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';

/**
 * 浏览器环境 Context (方便在测试环境模拟浏览器环境)
 */
const BrowserEnvContext = React.createContext({
  isWalletWebview: false,
  isMobile: false,
});

const { Provider, Consumer } = BrowserEnvContext;

// eslint-disable-next-line react/prop-types
function BrowserEnvProvider({ children }) {
  const browser = useBrowser();
  const value = {
    isWalletWebview: browser.wallet,
    isMobile: browser.mobile.any,
  };

  return <Provider value={value}>{children}</Provider>;
}

function useBrowserEnvContext() {
  return useContext(BrowserEnvContext);
}

export {
  BrowserEnvContext,
  BrowserEnvProvider,
  Consumer as BrowserEnvConsumer,
  useBrowserEnvContext,
};
