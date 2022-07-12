const { mergeConfig } = require('vite');
const { default: Unocss } = require('unocss/vite');
const { default: presetUno } = require('@unocss/preset-uno');
const { default: presetIcons } = require('@unocss/preset-icons');
const svgLoader = require('../src/plugins/svg-loader');

module.exports = {
  async viteFinal(config, { configType }) {
    // return the customized config
    return mergeConfig(config, {
      build: {
        sourcemap: false,
      },
      plugins: [
        Unocss({
          presets: [
            presetIcons({
              extraProperties: {
                display: 'inline-block',
                'vertical-align': 'middle',
              },
            }),
            presetUno(),
          ],
        }),
        svgLoader({
          defaultImport: 'url', // or 'raw'
          svgo: false,
        }),
      ],
    });
  },
  stories: ['../stories/**/*.stories.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: '@storybook/vue3',
  core: {
    builder: '@storybook/builder-vite',
  },
  features: {
    storyStoreV7: true,
  },
};
