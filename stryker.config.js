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
    break: 82
  },
  dashboard: {
    project: 'github.com/michaeltg17/Angular',
    module: 'angular-app',
    version: process.env.GITHUB_SHA || process.env.BRANCH_NAME || 'local',
    baseUrl: 'https://dashboard.stryker-mutator.io',
    reportType: 'mutation'
  }
};
