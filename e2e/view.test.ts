import { expect, Page } from '@playwright/test';
import { test } from './fixtures';

async function clickRowById(page: Page, id: string | number) {
  const rows = page.locator('tr[mat-row]');
  const target = rows.filter({ has: page.locator(`td:nth-child(2):has-text("${id}")`) }).first();
  await expect(target).toBeVisible();
  await target.click();
}

test('clicking a row opens view dialog with readonly fields', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  // click the row with id 2 (Jacob Wilson)
  await clickRowById(page, 2);

  // wait for dialog to appear and assert title
  await page.waitForSelector('mat-dialog-container');
  const title = page.locator('mat-dialog-container [mat-dialog-title]');
  await expect(title).toHaveText(/View Customer/i);

  // inputs should have readonly attribute
  const dialogContent = page.locator('mat-dialog-container mat-dialog-content');
  await expect(dialogContent.locator('input[readonly]')).toHaveCount(4);

  // checkbox should be disabled in view mode — check the internal input element
  const checkboxInput = dialogContent.locator('mat-checkbox input[type="checkbox"]');
  await expect(checkboxInput).toBeDisabled();

  // verify the dialog shows the expected customer name
  await expect(dialogContent.locator('input').first()).toHaveValue(/Jacob|Gary|Joann/i);
});
