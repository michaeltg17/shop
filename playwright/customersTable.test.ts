import { expect } from '@playwright/test';
import { test } from './fixtures';

test('loadCustomers invoked only once across navigation', async ({ page }) => {
  let apiCount = 0;

  page.on('request', request => {
    try {
      if (request.url().endsWith('/api/customers') && request.method() === 'GET') apiCount++;
    } catch {}
  });

  // Open app (navigate directly to /customers)
  await page.goto('/admin/customers');

  // Wait for the first customers response
  await page.waitForResponse(resp => resp.url().endsWith('/api/customers') && resp.request().method() === 'GET');
  expect(apiCount).toBeGreaterThanOrEqual(1);

  // Click toolbar button to go to user page
  const userBtn = page.locator('button:has-text("User")');
  await expect(userBtn).toBeVisible();
  await userBtn.click();
  await page.waitForURL(/\/admin\/user/);

  // Navigate back to customers page
  await page.goBack();
  await page.waitForURL(/\/admin\/customers/);

  // Allow a short grace period for any unexpected network calls
  await page.waitForTimeout(500);

  // Ensure only the original request(s) were made (no additional calls on re-entry)
  expect(apiCount).toBe(1);
});
