const path = require('path');

module.exports = {
  root: true,
  extends: ['@arcblock/eslint-config-ts'],
  parserOptions: {
    project: path.resolve(__dirname, 'tsconfig.eslint.json'),
  },
  rules: {
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    'require-await': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'react/require-default-props': [
      'error',
      {
        classes: 'defaultProps',
        functions: 'defaultArguments',
      },
    ],
  },
};
