import { test as base, expect } from '@playwright/test';

export { expect };
export const test = base.extend({
  context: async ({ context }, use) => {
    const mutantId = process.env.__STRYKER_ACTIVE_MUTANT__;

    await context.addInitScript(id => {
      (window as any).process = {
        env: { __STRYKER_ACTIVE_MUTANT__: id }
      };
      localStorage.setItem(
        'angular_auth_user',
        JSON.stringify({ username: 'admin', isAdmin: true })
      );
    }, mutantId);

    await use(context);
  }
});
