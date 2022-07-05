const path = require('path');

module.exports = {
  root: true,
  extends: ['@arcblock/eslint-config-ts'],
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.eslint.json'),
  },
  rules: {
    '@typescript-eslint/no-use-before-define': 'off',
  },
};
