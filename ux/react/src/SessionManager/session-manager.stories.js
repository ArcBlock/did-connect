/* eslint-disable react/jsx-filename-extension */

import { LocaleProvider } from '@arcblock/ux/lib/Locale/context';
import SessionManager from '.';

export { default as HasLogin } from './demo/has-login';
export { default as NotLogin } from './demo/not-login';
export { default as Callback } from './demo/callback';
export { default as DarkMode } from './demo/dark-mode';
export { default as Sizes } from './demo/sizes';
export { default as UsingBlockletService } from './demo/using-blocklet-service';

export default {
  title: 'Composed/SessionManager',
  component: SessionManager,
  parameters: { actions: { argTypesRegex: '^on.*' }, controls: { include: ['onLogin', 'onLogout'] } },
  decorators: [
    (Story) => (
      <LocaleProvider translations={{}}>
        <Story />
      </LocaleProvider>
    ),
  ],
};
