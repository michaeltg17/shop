import { test, expect } from './fixtures';

test('search for "wilson" returns two rows', async ({ page }) => {
  await page.goto('/admin/users');
  // wait for the table to render
  await page.waitForSelector('tr[mat-row]');

  // type into the search box and assert two rows match
  await page.fill('input[placeholder="Search"]', 'wilson');

  const rows = page.locator('tr[mat-row]');
  await expect(rows).toHaveCount(2);

  // verify the rows include expected text (one with last name Wilson)
  await expect(rows.nth(0)).toContainText(/Wilson/i);
  await expect(rows.nth(1)).toContainText(/wilson/i);
});
