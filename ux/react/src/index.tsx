import { ThemeProvider } from '@arcblock/ux/lib/Theme';

import Connect from './Connect';
import Button from './Button';
import Session from './Session';

import { TConnectProps } from './types';

export { Connect, ThemeProvider, Button, Session };

// If you do not want to wrap your app in a <Provider>, you can use the ThemedConnect component
export function ThemedConnect(props: TConnectProps) {
  return (
    <ThemeProvider>
      <Connect {...props} />
    </ThemeProvider>
  );
}
