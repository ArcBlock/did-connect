import { create } from '@storybook/theming';
import { addons } from '@storybook/addons';

addons.setConfig({
  theme: create({
    brandTitle: 'DID Connect React',
    brandUrl: 'https://arcblock.github.io/ux',
  }),
});
