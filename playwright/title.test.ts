import { test } from './fixtures';
import { expect } from '@playwright/test';

test('has correct title', async ({ page }) => {
  //Page has title
  await page.goto('/admin/customers');
  await expect(page).toHaveTitle('Angular App');

  // Toolbar has title
  const toolbar = page.locator('mat-toolbar span').first();
  await expect(toolbar).toHaveText('Angular App');
});
