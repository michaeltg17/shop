/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
module.exports = {
  mutate: [
    'src/app/**/*.ts',
    '!src/**/*.spec.ts',
  ],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.ts'
  },
  reporters: ['html', 'clear-text', 'progress'],
  coverageAnalysis: 'perTest',
  tsconfigFile: 'tsconfig.json',
  cleanTempDir: 'always',
  incremental: true,
  thresholds: {
    break: 83
  }
};
