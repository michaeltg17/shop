/** @jest-config-loader esbuild-register */

import type { Config } from 'jest';
import { createCjsPreset } from 'jest-preset-angular/presets/index.js';

export default {
    ...createCjsPreset(),
    testPathIgnorePatterns: ['<rootDir>/playwright/', '<rootDir>/.stryker-tmp'],
    coverageThreshold: {
        global: {
            branches: 75,
            functions: 88,
            lines: 90,
            statements: 89
        }
    },
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts']
} satisfies Config;
