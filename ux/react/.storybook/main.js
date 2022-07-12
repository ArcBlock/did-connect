module.exports = {
  stories: ['../**/*.stories.(js|mdx)'],
  addons: [
    '@storybook/addon-backgrounds',
    '@storybook/addon-actions',
    '@storybook/addon-links',
    '@storybook/addon-viewport',
    '@storybook/addon-storysource',
    '@storybook/addon-docs',
  ],
  babel: async (options) => {
    console.log(options);
    return {
      ...options,
      // any extra options you want to set
    };
  },
};
