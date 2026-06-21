/** @jest-config-loader esbuild-register */

import type { Config } from 'jest';
import { createCjsPreset } from 'jest-preset-angular/presets/index.js';

export default {
  ...createCjsPreset(),
  testPathIgnorePatterns: ['<rootDir>/playwright/', '<rootDir>/.stryker-tmp'],
  coverageReporters: ['json-summary', 'lcov', 'text', 'clover'],
  coverageThreshold: {
    global: {
      branches: 87,
      functions: 93,
      lines: 93,
      statements: 93,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
} satisfies Config;
