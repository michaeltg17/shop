module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': 'jest-preset-angular'
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  testPathIgnorePatterns: [
    '<rootDir>/playwright/'
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 88,
      lines: 90,
      statements: 89
    }
  }
};
