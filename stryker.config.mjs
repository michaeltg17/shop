// /** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
// const config = {
//   packageManager: 'npm',
//   reporters: ['html', 'clear-text', 'progress'],
//   testRunner: 'command',
//   coverageAnalysis: 'off',
//   buildCommand: 'node start-server.js',
//   mutate: ['src/app/features/customers/customer.service.ts'],
//   //mutate: ['src/app/services/title.service.ts', 'src/app/services/customer.service.ts'],
//   //mutate: ['src/app/**/*.ts'],
//   commandRunner: {
//     command: 'node run-playwright.js'
//   },
//   logLevel: 'trace',
//   fileLogLevel: 'trace',
//   timeoutFactor: 3
// };
// export default config;

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  "testRunner": "vitest",
  "vitest": {
    "related": false
  }
};
export default config;
