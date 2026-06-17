import { test, expect, Page } from '@playwright/test';

// helper to click the checkbox for the row where the id cell (second td) equals `id`
async function selectRowById(page: Page, id: string | number) {
  const rows = page.locator('tr[mat-row]');
  const target = rows.filter({ has: page.locator(`td:nth-child(2):has-text("${id}")`) }).first();
  await expect(target).toBeVisible();
  // the checkbox is in the first td
  await target.locator('td:nth-child(1) mat-checkbox').click();
}

test.describe('delete flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/customers');
    await page.waitForSelector('tr[mat-row]');
  });

  test('delete confirmed removes rows and disables delete when none selected', async ({ page }) => {
    const deleteBtn = page.locator('app-customers-table').locator('button:has-text("delete")');

    // delete disabled with no selection
    await expect(deleteBtn).toBeDisabled();

    // select rows with id 3 and 4
    await selectRowById(page, 3);
    await selectRowById(page, 4);

    await expect(deleteBtn).toBeEnabled();

    // click delete and confirm
    await deleteBtn.click();
    const dialog = page.locator('mat-dialog-actions');
    await expect(dialog).toBeVisible();
    await dialog.locator('button:has-text("Delete")').click();

    // wait for table to refresh after deletion
    await page.waitForSelector('tr[mat-row]', { state: 'attached' });

    // ensure rows with id 3 and 4 are no longer present
    await expect(page.locator('td:nth-child(2):has-text("3")')).toHaveCount(0);
    await expect(page.locator('td:nth-child(2):has-text("4")')).toHaveCount(0);

    // delete button should be disabled again
    await expect(deleteBtn).toBeDisabled();
  });

  test('canceling delete keeps rows intact', async ({ page }) => {
    const deleteBtn = page.locator('app-customers-table').locator('button:has-text("delete")');

    // ensure delete disabled initially
    await expect(deleteBtn).toBeDisabled();

    // select rows 3 and 4
    await selectRowById(page, 3);
    await selectRowById(page, 4);

    await expect(deleteBtn).toBeEnabled();

    // click delete and cancel
    await deleteBtn.click();
    const dialog = page.locator('mat-dialog-actions');
    await expect(dialog).toBeVisible();
    await dialog.locator('button:has-text("Cancel")').click();

    // rows should still exist
    await expect(page.locator('td:nth-child(2):has-text("3")')).toHaveCount(1);
    await expect(page.locator('td:nth-child(2):has-text("4")')).toHaveCount(1);

    // delete button should still be enabled because selection remains
    await expect(deleteBtn).toBeEnabled();
  });
});
