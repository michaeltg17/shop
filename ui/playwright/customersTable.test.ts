import { expect } from '@playwright/test';
import { test } from './fixtures';

test('loadCustomers invoked only once across navigation', async ({ page }) => {
  let apiCount = 0;

  page.on('request', request => {
    try {
      if (request.url().endsWith('/api/users') && request.method() === 'GET') apiCount++;
    } catch {}
  });

  // Open app (navigate directly to /customers)
  await page.goto('/admin/users');

  // Wait for the first customers response
  await page.waitForResponse(resp => resp.url().endsWith('/api/users') && resp.request().method() === 'GET');
  expect(apiCount).toBeGreaterThanOrEqual(1);

  // Click toolbar button to go to user page (exact match to avoid matching "Users")
  const userBtn = page.getByRole('button', { name: 'User', exact: true });
  await expect(userBtn).toBeVisible();
  await userBtn.click();
  await page.waitForURL(/\/admin\/user/);

  // Navigate back to customers page
  // goBack + waitForURL can be flaky in SPA; use a broader URL match and longer timeout
  await page.goBack({ timeout: 10000 });
  await page.waitForURL(/\/admin/, { timeout: 10000 });

  // Allow a short grace period for any unexpected network calls
  await page.waitForTimeout(500);

  // Ensure only the original request(s) were made (no additional calls on re-entry)
  expect(apiCount).toBe(1);
});
