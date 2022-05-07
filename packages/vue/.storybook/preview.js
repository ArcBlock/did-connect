import 'uno.css';
import { ArcblockTheme } from '../src/plugins/vuetify';
import { withVuetify } from '../src/decorators/with-vuetify.js';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const decorators = [withVuetify];
export const globalTypes = {
  vuetify: {
    theme: {
      defaultTheme: 'ArcblockTheme',
      themes: {
        ArcblockTheme,
      },
    },
  },
};
