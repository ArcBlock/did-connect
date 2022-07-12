module.exports = function ({ config }) {
  config.module.rules.push(
    {
      test: /\.stories\.tsx?$/,
      loaders: [
        {
          loader: require.resolve('@storybook/source-loader'),
          options: {
            parser: 'javascript',
            prettierConfig: {
              printWidth: 100,
              tabWidth: 2,
              bracketSpacing: true,
              trailingComma: 'es5',
              singleQuote: true,
            },
          },
        },
      ],
      enforce: 'pre',
    },
    // 消除 dev 启动时 warnings, https://github.com/graphql/graphiql/issues/617#issuecomment-344104641
    { test: /\.flow$/, loader: 'ignore-loader' }
  );

  return config;
};
