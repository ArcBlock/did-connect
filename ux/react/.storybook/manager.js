const { addons } = require('@storybook/addons');
const { create } = require('@storybook/theming');

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'DID Connect React',
    brandUrl: '/',
    brandImage: '/logos/logo-h.png', // from root blocklet
    brandTarget: '_self',
  }),
});
