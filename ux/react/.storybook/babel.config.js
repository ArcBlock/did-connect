module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          edge: '17',
          firefox: '60',
          chrome: '67',
          safari: '11.1',
        },
        modules: 'commonjs',
        useBuiltIns: 'entry',
        corejs: 3,
      },
    ],
    ['@babel/preset-react', { useBuiltIns: true, runtime: 'automatic' }],
  ],
  plugins: [
    '@emotion',
    'babel-plugin-styled-components',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-proposal-class-properties',
    [
      'babel-plugin-inline-react-svg',
      {
        svgo: {
          plugins: [
            {
              cleanupIDs: false,
            },
          ],
        },
      },
    ],
  ],
};
