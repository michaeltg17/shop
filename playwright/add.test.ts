import { test, expect } from './fixtures';
import { UserTablePage, UserFormPage } from './pages/users';

// Adds correctly - Clicks add button to open add dialog
// - Fills all fields with valid values
// - Clicks add
// - User is added to the table
test('Adds correctly - Clicks add button to open add dialog', async ({ page }) => {
  // This test exercises a full flow: navigate → add → sort → search → verify.
  // 5 s global timeout is too tight for the full sequence.
  test.setTimeout(30_000);
  const usersPage = new UserTablePage(page);
  await usersPage.goto();

  const formPage = await usersPage.openAddDialog();

  const firstName = `E2EFirst${Date.now()}`;
  const phoneNumber = '123-456-7890';
  await formPage.fillForm({
    firstName,
    lastName: 'Tester',
    email: `${firstName.toLowerCase()}@example.com`,
    phone: phoneNumber,
    active: true,
  });

  // Trigger Angular OnPush change detection by pressing Tab (fill() alone may not
  // trigger CD reliably in headless Chromium). This moves focus away from the
  // last filled input, causing Angular to re-evaluate the form validity.
  await page.keyboard.press('Tab');

  // click Add button in dialog
  await expect(formPage.addButton).toBeEnabled();

  // Wait for POST to complete and dialog to close
  await formPage.submitAndWaitForResponse();

  // dialog should be closed
  await usersPage.waitForDialogClose();

  // Wait for URL to settle
  await page.waitForURL(/\/admin\/users$/);

  // Sort by ID descending to bring the newest user to the first page
  await usersPage.sortByIdDescending();

  // Wait for table to have at least one row after sorting
  await page.waitForSelector('tr[mat-row]', { timeout: 10000 });

  // Instead of fighting the paginator's touch-target overlay, use the table's search/filter
  // input to narrow down to our unique test user (avoids pagination issues entirely)
  const searchInput = page.locator('mat-form-field input[placeholder="Search"]');
  await searchInput.fill(firstName);
  // Wait for table to filter — use a selector wait instead of a bare timeout
  await page.waitForSelector('tr[mat-row]', { timeout: 10000 });

  // Verify the user appears as a row in the table with expected data
  const expectedLastName = 'Tester';
  const expectedEmail = `${firstName.toLowerCase()}@example.com`;
  const expectedPhone = phoneNumber;

  const row = usersPage.findRowByText(firstName);
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
  const usersPage = new UserTablePage(page);
  await usersPage.goto();

  const formPage = await usersPage.openAddDialog();

  // leave first name empty
  await formPage.fillForm({
    firstName: '',
    lastName: 'Tester',
    email: 'valid@example.com',
    phone: '123-456-7890',
    active: true,
  });

  // expect an error for first name and Add disabled
  await expect(formPage.dialog.locator('mat-error')).toBeVisible();
  await expect(formPage.addButton).toBeDisabled();
});

// Validations - invalid email
test('Validations - Invalid email shows error and disables Add', async ({ page }) => {
  const usersPage = new UserTablePage(page);
  await usersPage.goto();

  const formPage = await usersPage.openAddDialog();
  await formPage.fillForm({
    firstName: 'Jane',
    lastName: 'Tester',
    email: 'not-an-email',
    phone: '123-456-7890',
    active: true,
  });

  // expect an email-specific error and Add disabled
  await expect(formPage.dialog.locator('mat-error:has-text("Invalid email")')).toBeVisible();
  await expect(formPage.addButton).toBeDisabled();
});

// Canceling when no changes - Click cancel
test('Canceling when no changes - Click cancel', async ({ page }) => {
  const usersPage = new UserTablePage(page);
  await usersPage.goto();

  const formPage = await usersPage.openAddDialog();
  await formPage.clickCancel();
  await usersPage.waitForDialogClose();

  // nothing added: ensure no row with a unique test marker exists (we didn't add one)
});

// Canceling when no changes - Click outside
test('Canceling when no changes - Click outside', async ({ page }) => {
  const usersPage = new UserTablePage(page);
  await usersPage.goto();

  await usersPage.openAddDialog();

  // click near top-left to click outside dialog
  await page.mouse.click(5, 5);
  await usersPage.waitForDialogClose();
});

// Canceling when no changes - Click back
test('Canceling when no changes - Click back', async ({ page }) => {
  const usersPage = new UserTablePage(page);
  await usersPage.goto();

  await usersPage.openAddDialog();

  // go back should close dialog (no pending changes)
  // Handle any beforeunload dialog by dismissing it
  page.once('dialog', dialog => dialog.dismiss());
  await page.goBack({ waitUntil: 'load' });

  // dialog should be closed after navigation
  await usersPage.waitForDialogClose();
});

// Canceling when changes - Click cancel
test('Canceling when changes - Click cancel', async ({ page }) => {
  const usersPage = new UserTablePage(page);
  await usersPage.goto();

  const formPage = await usersPage.openAddDialog();
  await formPage.fillForm({
    firstName: 'Changed',
    lastName: 'Tester',
    email: 'changed@example.com',
    phone: '123-456-7890',
    active: true,
  });
  await formPage.clickCancel();
  await usersPage.waitForDialogClose();
});

// Canceling when changes - Click outside (should stay open)
test('Canceling when changes - Click outside', async ({ page }) => {
  const usersPage = new UserTablePage(page);
  await usersPage.goto();

  const formPage = await usersPage.openAddDialog();
  await formPage.fillForm({
    firstName: 'Changed',
    lastName: 'Tester',
    email: 'changed@example.com',
    phone: '123-456-7890',
    active: true,
  });

  // click outside; since dialog.disableClose is set true when dirty, it should stay
  await page.mouse.click(5, 5);
  await expect(page.locator('mat-dialog-container')).toHaveCount(1);
});

// Canceling when changes - Click back (multiple cancels then confirm)
test('Canceling when changes - Click back', async ({ page }) => {
  const usersPage = new UserTablePage(page);
  await usersPage.goto();

  await usersPage.openAddDialog();

  // make a change
  const formPage = new UserFormPage(page);
  await formPage.firstNameInput.fill('ChangedViaBack');

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

  await usersPage.waitForDialogClose();
});
