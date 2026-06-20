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
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  coverageAnalysis: 'perTest',
  tsconfigFile: 'tsconfig.json',
  cleanTempDir: 'always',
  incremental: true,
  thresholds: {
    break: 80
  },
  dashboard: {
    reportType: 'full',
    project: 'michaeltg17/Angular',
    version: 'main'
  }
};
