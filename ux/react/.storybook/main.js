const webpack = require('webpack');
const path = require('path');

module.exports = {
  stories: ['../**/*.stories.@(js|mdx)'],
  features: {
    storyStoreV7: true,
  },
  addons: [
    '@storybook/addon-links',
    {
      name: '@storybook/addon-docs',
      options: {
        sourceLoaderOptions: {
          injectStoryParameters: false,
        },
      },
    },
    '@storybook/addon-essentials',
    '@arcblock/addon-storysource',
  ],
  core: {
    builder: {
      name: 'webpack5',
    },
  },
  babel: async (options) => {
    return {
      ...options,
      // any extra options you want to set
    };
  },
  webpackFinal: async (config) => {
    config.module.rules.unshift({
      test: /\/demo\/[\w-]+\.[jt]sx?$/,
      use: [
        {
          loader: path.resolve(__dirname, './modules/demo-source-loader.js'),
        },
      ],
    });

    // 解决: 开启 webpack 5 后, 启动 storybook 报 graphql 相关错误
    // https://github.com/aws-amplify/amplify-js/issues/7260#issuecomment-840750788
    config.module.rules.push({
      test: /\.m?jsx?$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Buffer polyfill
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
      })
    );
    return config;
  },
};
