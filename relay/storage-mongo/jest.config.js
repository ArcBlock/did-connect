const base = require('../../jest.config.base');

module.exports = {
  ...base,
  collectCoverageFrom: [
    'lib/*.js',
    'lib/**/*.js',
    '!**/*.spec.ts',
    '!**/gen/**',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!apps/**',
    '!examples/**',
    '!tools/**',
    '!scripts/**',
    '!jest.config.base.js',
    '!jest.config.js',
    '!babel.config.js',
    '!webpack.config.js',
    '!eslintrc.js',
  ],
};
