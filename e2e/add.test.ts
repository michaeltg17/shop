import { test, expect, Page } from '@playwright/test';

async function openAddDialog(page: Page) {
  // click the first icon-button in the customers table (Add)
  const addBtn = page.locator('app-customers-table button[mat-icon-button]').first();
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  await page.waitForSelector('mat-dialog-container');
  return page.locator('mat-dialog-container');
}

async function fillAddForm(dialog: any, first = 'E2E', last = 'User', email = 'e2e@example.com', phone = '123-456-7890', active = true) {
  const inputs = dialog.locator('input');
  await inputs.nth(0).fill(first);
  await inputs.nth(1).fill(last);
  await inputs.nth(2).fill(email);
  await inputs.nth(3).fill(phone);
  const checkbox = dialog.locator('mat-checkbox input[type="checkbox"]');
  const checked = await checkbox.isChecked();
  if (checked !== active) await dialog.locator('mat-checkbox').click();
}

// Adds correctly - Clicks add button to open add dialog
// - Fills all fields with valid values
// - Clicks add
// - Customer is added to the table
test('Adds correctly - Clicks add button to open add dialog', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);

  const firstName = `E2EFirst${Date.now()}`;
  const phoneNumber = '123-456-7890';
  await fillAddForm(dialog, firstName, 'Tester', `${firstName.toLowerCase()}@example.com`, phoneNumber, true);

  // click Add button in dialog
  const addBtn = dialog.locator('button:has-text("Add")');
  await expect(addBtn).toBeEnabled();
  
  // Get initial row count before adding
  const initialRowCount = await page.locator('tr[mat-row]').count();
  
  // Wait for POST to complete and dialog to close
  await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/customers') && resp.status() === 201),
    addBtn.click()
  ]);

  // dialog should be closed
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);

  // Wait for URL to settle
  await page.waitForURL(/\/customers$/);

  // Sort by ID descending to bring the newest customer to the first page
  // Click on the ID column header to sort
  const idHeader = page.locator('th[mat-header-cell]:has-text("Id")').first();
  await idHeader.click();
  // Click again to toggle to descending order
  await idHeader.click();

  // Wait for table to update after sorting
  await page.waitForSelector('tr[mat-row]', { timeout: 5000 });

  // Verify the customer appears as a row in the table with expected data
  const expectedLastName = 'Tester';
  const expectedEmail = `${firstName.toLowerCase()}@example.com`;
  const expectedPhone = phoneNumber;
  
  // Find the row containing the first name (should be first row after sorting by ID desc)
  const row = page.locator(`tr[mat-row]:has-text("${firstName}")`);
  await expect(row).toBeVisible();
  
  // Verify all expected data is displayed in the row
  // Table columns: select, id, firstName, lastName, email, phoneNumber, isActive
  await expect(row.locator('td').nth(2)).toHaveText(firstName);
  await expect(row.locator('td').nth(3)).toHaveText(expectedLastName);
  await expect(row.locator('td').nth(4)).toHaveText(expectedEmail);
  await expect(row.locator('td').nth(5)).toHaveText(expectedPhone);
});

// Validations - test missing first name
test('Validations - Missing first name shows error and disables Add', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  // leave first name empty
  await fillAddForm(dialog, '', 'Tester', 'valid@example.com');

  // expect an error for first name and Add disabled
  await expect(dialog.locator('mat-error')).toBeVisible();
  await expect(dialog.locator('button:has-text("Add")')).toBeDisabled();
});

// Validations - invalid email
test('Validations - Invalid email shows error and disables Add', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  await fillAddForm(dialog, 'Jane', 'Tester', 'not-an-email');

  // expect an error for email and Add disabled
  await expect(dialog.locator('mat-error')).toBeVisible();
  await expect(dialog.locator('button:has-text("Add")')).toBeDisabled();
});

// Canceling when no changes - Click cancel
test('Canceling when no changes - Click cancel', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  await dialog.locator('button:has-text("Cancel")').click();
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);

  // nothing added: ensure no row with a unique test marker exists (we didn't add one)
});

// Canceling when no changes - Click outside
test('Canceling when no changes - Click outside', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  await openAddDialog(page);
  // click near top-left to click outside dialog
  await page.mouse.click(5, 5);
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
});

// Canceling when no changes - Click back
test('Canceling when no changes - Click back', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  await openAddDialog(page);

  // go back should close dialog (no pending changes)
  // Handle any beforeunload dialog by dismissing it
  page.once('dialog', dialog => dialog.dismiss());
  await page.goBack({ waitUntil: 'load' });

  // dialog should be closed after navigation
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
});

// Canceling when changes - Click cancel
test('Canceling when changes - Click cancel', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  await fillAddForm(dialog, 'Changed', 'Tester', 'changed@example.com');
  await dialog.locator('button:has-text("Cancel")').click();
  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
});

// Canceling when changes - Click outside (should stay open)
test('Canceling when changes - Click outside', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  const dialog = await openAddDialog(page);
  await fillAddForm(dialog, 'Changed', 'Tester', 'changed@example.com');

  // click outside; since dialog.disableClose is set true when dirty, it should stay
  await page.mouse.click(5, 5);
  await expect(page.locator('mat-dialog-container')).toHaveCount(1);
});

// Canceling when changes - Click back (multiple cancels then confirm)
test('Canceling when changes - Click back', async ({ page }) => {
  await page.goto('/customers');
  await page.waitForSelector('tr[mat-row]');

  await openAddDialog(page);
  // make a change
  const dialog = page.locator('mat-dialog-container');
  await dialog.locator('input').first().fill('ChangedViaBack');

  // Set up dialog handler to dismiss by default
  let dismissDialog = true;
  page.on('dialog', d => {
    if (dismissDialog) {
      d.dismiss();
    } else {
      d.accept();
    }
  });

  // perform back several times and dismiss the confirm dialog (stay)
  for (let i = 0; i < 3; i++) {
    // Click the browser back button
    await page.evaluate(() => window.history.back());
    // dialog should still be present
    await expect(page.locator('mat-dialog-container')).toHaveCount(1);
  }

  // final back: accept and allow close
  dismissDialog = false;
  await page.evaluate(() => window.history.back());

  await expect(page.locator('mat-dialog-container')).toHaveCount(0);
});
