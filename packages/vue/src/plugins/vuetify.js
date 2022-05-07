import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export const ArcblockTheme = {
  dark: false,
  colors: {
    did: '#4598FA',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#4F6AF6',
    // 'primary-darken-1': '#3700B3',
    secondary: '#31AB86',
    // 'secondary-darken-1': '#018786',
    error: '#F16E6E',
    info: '#0775F8',
    success: '#34BE74',
    warning: '#DE9E37',
  },
};

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'ArcblockTheme',
    themes: {
      ArcblockTheme,
    },
  },
});
