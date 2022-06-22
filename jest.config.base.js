const path = require('path');

const cwd = process.cwd();
const folder = path.basename(cwd);
const parent = path.basename(path.dirname(cwd));

// eslint-disable-next-line import/no-dynamic-require
const { name } = require(`${cwd}/package.json`);

const rootDir = path.resolve(__dirname);

// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html
module.exports = {
  rootDir,
  displayName: name,
  verbose: true,
  clearMocks: true,
  forceExit: true,
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testEnvironment: 'node',
  testMatch: [`<rootDir>/${parent}/${folder}/**/*.spec.ts`, `<rootDir>/${parent}/${folder}/**/*.spec.js`],
  coverageDirectory: path.join(cwd, 'coverage'),
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverage: process.argv.indexOf('--coverage') > 0,
  collectCoverageFrom: [
    `<rootDir>/${parent}/${folder}/src/*.ts`,
    `<rootDir>/${parent}/${folder}/src/**/*.ts`,
    `<rootDir>/${parent}/${folder}/src/*.js`,
    `<rootDir>/${parent}/${folder}/src/**/*.js`,
    `!<rootDir>/${parent}/${folder}/**/*.spec.ts`,
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
