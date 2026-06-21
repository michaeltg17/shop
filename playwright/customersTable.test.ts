import { expect } from '@playwright/test';
import { test } from './fixtures';

test('loadUsers invoked only once across navigation', async ({ page }) => {
  let apiCount = 0;

  page.on('request', request => {
    try {
      if (request.url().includes('/users') && request.method() === 'GET') apiCount++;
    } catch {}
  });

  // Open app (navigate directly to /admin/users)
  await page.goto('/admin/users');

  // Wait for the first users response
  await page.waitForResponse(resp => resp.url().includes('/users') && resp.request().method() === 'GET');
  expect(apiCount).toBeGreaterThanOrEqual(1);

  // Click toolbar button to go to user page
  const userBtn = page.locator('button:has-text("User")');
  await expect(userBtn).toBeVisible();
  await userBtn.click();
  await page.waitForURL(/\/admin\/user/);

  // Navigate back to users page
  await page.goBack();
  await page.waitForURL(/\/admin\/users/);

  // Allow a short grace period for any unexpected network calls
  await page.waitForTimeout(500);

  // Ensure only the original request(s) were made (no additional calls on re-entry)
  expect(apiCount).toBe(1);
});
