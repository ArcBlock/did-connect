import { createContext, useContext } from 'react';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';

export type ContextState = {
  isWalletWebview: boolean;
  isMobile: boolean;
};

/**
 * 浏览器环境 Context (方便在测试环境模拟浏览器环境)
 */
const BrowserEnvContext = createContext<ContextState>({
  isWalletWebview: false,
  isMobile: false,
});

const { Provider, Consumer } = BrowserEnvContext;

function BrowserEnvProvider({ children }: React.PropsWithChildren<{}>) {
  const browser = useBrowser();
  const value = {
    isWalletWebview: browser.wallet,
    isMobile: browser.mobile.any,
  };

  return <Provider value={value}>{children}</Provider>;
}

function useBrowserEnvContext(): ContextState {
  return useContext(BrowserEnvContext);
}

export { BrowserEnvContext, BrowserEnvProvider, Consumer as BrowserEnvConsumer, useBrowserEnvContext };
