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
        useBuiltIns: 'entry',
        corejs: 3,
      },
    ],
    ['@babel/preset-react', { useBuiltIns: true, runtime: 'automatic' }],
    ['@babel/preset-typescript'],
  ],
  plugins: ['babel-plugin-styled-components', 'babel-plugin-inline-react-svg'],
};
