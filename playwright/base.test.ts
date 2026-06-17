import { expect } from '@playwright/test';
import { test } from './fixtures';

test('Browser has mutant id', async ({ page }) => {
  await page.goto('/login');

  const mutantId = await page.evaluate(() => {
    return (window as any).process?.env?.__STRYKER_ACTIVE_MUTANT__;
  });

  expect(mutantId).toBe(process.env.__STRYKER_ACTIVE_MUTANT__);
});
