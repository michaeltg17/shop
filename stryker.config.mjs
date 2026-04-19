/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
module.exports = {
  mutate: [
    'src/app/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/test.ts',
    '!src/environments/*.ts'
  ],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js'
  },
  reporters: ['html', 'clear-text', 'progress'],
  coverageAnalysis: 'off', // safer default for Angular + Jest
  tsconfigFile: 'tsconfig.json',
};
