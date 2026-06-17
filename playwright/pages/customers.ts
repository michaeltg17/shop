import { Page, Locator, expect } from '@playwright/test';

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface CustomerRowData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  active: boolean;
}

/**
 * Page Object for the Customers Table page
 * Handles all table-related operations
 */
export class CustomerTablePage {
  readonly page: Page;
  readonly tableRows: Locator;
  readonly addIconButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tableRows = page.locator('tr[mat-row]');
    this.addIconButton = page.locator('app-customers-table button[mat-icon-button]').first();
  }

  /**
   * Navigate to the customers page and wait for table to load
   */
  async goto(): Promise<void> {
    await this.page.goto('/admin/customers');
    await this.page.waitForSelector('tr[mat-row]');
  }

  /**
   * Get the row count in the table
   */
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }

  /**
   * Find a row containing the specified text (e.g., first name)
   */
  findRowByText(text: string): Locator {
    return this.page.locator(`tr[mat-row]:has-text("${text}")`);
  }

  /**
   * Find a row by exact data match
   */
  findRowByData(data: Partial<CustomerRowData>): Locator {
    const selectors: string[] = [];
    if (data.firstName) selectors.push(`has-text("${data.firstName}")`);
    if (data.lastName) selectors.push(`has-text("${data.lastName}")`);
    if (data.email) selectors.push(`has-text("${data.email}")`);
    if (data.phone) selectors.push(`has-text("${data.phone}")`);

    const selector = selectors.length > 0
      ? `tr[mat-row]:${selectors.join(':')}`
      : 'tr[mat-row]';

    return this.page.locator(selector);
  }

  /**
   * Get a header cell by text content
   */
  getHeaderByText(text: string): Locator {
    return this.page.locator(`th[mat-header-cell]:has-text("${text}")`).first();
  }

  /**
   * Click on a header to sort the column
   */
  async clickHeader(text: string): Promise<void> {
    const header = this.getHeaderByText(text);
    await header.click();
  }

  /**
   * Sort a column by clicking its header twice (ascending then descending)
   */
  async sortColumnDescending(text: string): Promise<void> {
    const header = this.getHeaderByText(text);
    await header.click();
    await header.click();
  }

  /**
   * Sort by ID in descending order (newest first)
   */
  async sortByIdDescending(): Promise<void> {
    await this.sortColumnDescending('Id');
  }

  /**
   * Verify a customer row exists and is visible
   */
  async verifyRowExists(text: string): Promise<void> {
    const row = this.findRowByText(text);
    await expect(row).toBeVisible();
  }

  /**
   * Verify row data at specific column indices
   * Table columns: select(0), id(1), firstName(2), lastName(3), email(4), phoneNumber(5), isActive(6)
   */
  async verifyRowData(row: Locator, columnIndex: number, expectedText: string): Promise<void> {
    await expect(row.locator('td').nth(columnIndex)).toHaveText(expectedText);
  }

  /**
   * Verify a complete customer row with all data
   */
  async verifyCustomerRow(firstName: string, data: CustomerRowData): Promise<void> {
    const row = this.findRowByText(firstName);

    await expect(row).toBeVisible();
    await expect(row.locator('td').nth(2)).toHaveText(data.firstName);
    await expect(row.locator('td').nth(3)).toHaveText(data.lastName);
    await expect(row.locator('td').nth(4)).toHaveText(data.email);
    await expect(row.locator('td').nth(5)).toHaveText(data.phone);
  }

  /**
   * Open the add dialog and return the CustomerFormPage
   */
  async openAddDialog(): Promise<CustomerFormPage> {
    await expect(this.addIconButton).toBeVisible();
    await this.addIconButton.click();
    await this.page.waitForSelector('mat-dialog-container');
    return new CustomerFormPage(this.page);
  }

  /**
   * Check if dialog is open
   */
  isDialogOpen(): Locator {
    return this.page.locator('mat-dialog-container');
  }

  /**
   * Wait for dialog to close
   */
  async waitForDialogClose(): Promise<void> {
    await expect(this.page.locator('mat-dialog-container')).toHaveCount(0);
  }
}

/**
 * Page Object for the Customer Add/Edit Dialog
 * Handles all form-related operations
 */
export class CustomerFormPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly activeCheckbox: Locator;
  readonly addButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.locator('mat-dialog-container');
    this.firstNameInput = this.dialog.locator('input').nth(0);
    this.lastNameInput = this.dialog.locator('input').nth(1);
    this.emailInput = this.dialog.locator('input').nth(2);
    this.phoneInput = this.dialog.locator('input').nth(3);
    this.activeCheckbox = this.dialog.locator('mat-checkbox input[type="checkbox"]');
    this.addButton = this.dialog.locator('button:has-text("Add")');
    this.cancelButton = this.dialog.locator('button:has-text("Cancel")');
  }

  /**
   * Fill the form with customer data
   */
  async fillForm(data: CustomerFormData): Promise<void> {
    await this.firstNameInput.fill(data.firstName);
    await this.lastNameInput.fill(data.lastName);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);

    const checked = await this.activeCheckbox.isChecked();
    if (checked !== data.active) {
      await this.dialog.locator('mat-checkbox').click();
    }
  }

  /**
   * Fill the form with individual parameters
   */
  async fillFormWithParams(
    firstName: string,
    lastName: string,
    email: string,
    phone: string,
    active = true
  ): Promise<void> {
    await this.fillForm({ firstName, lastName, email, phone, active });
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.firstNameInput.clear();
    await this.lastNameInput.clear();
    await this.emailInput.clear();
    await this.phoneInput.clear();
  }

  /**
   * Click the Add button
   */
  async clickAdd(): Promise<void> {
    await this.addButton.click();
  }

  /**
   * Click the Cancel button
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Submit the form and wait for the API response
   */
  async submitAndWaitForResponse(): Promise<void> {
    await Promise.all([
      this.page.waitForResponse(resp =>
        resp.url().includes('/api/customers') && resp.status() === 201
      ),
      this.clickAdd()
    ]);
  }

  /**
   * Check if the Add button is enabled
   */
  async isAddButtonEnabled(): Promise<boolean> {
    return await this.addButton.isEnabled();
  }

  /**
   * Check if the Add button is disabled
   */
  async isAddButtonDisabled(): Promise<boolean> {
    return await this.addButton.isDisabled();
  }

  /**
   * Check if there are validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    return await this.dialog.locator('mat-error').isVisible();
  }

  /**
   * Get validation error text
   */
  async getValidationErrorText(): Promise<string | null> {
    const errorElement = this.dialog.locator('mat-error');
    const count = await errorElement.count();
    return count > 0 ? await errorElement.first().textContent() : null;
  }

  /**
   * Check if the dialog is dirty (has unsaved changes)
   * A dirty dialog typically cannot be closed by clicking outside
   */
  async isDirty(): Promise<boolean> {
    // Try clicking outside - if dialog stays open, it's dirty
    const wasVisibleBefore = await this.dialog.isVisible();
    if (!wasVisibleBefore) return false;

    // Check if disableClose is set on MatDialog
    // This is an indirect check - we look for the overlay behavior
    const overlay = this.page.locator('mat-overlay-pane');
    await overlay.elementHandle();

    // If we can't easily determine, return based on form fields
    const firstNameValue = await this.firstNameInput.inputValue();
    const lastNameValue = await this.lastNameInput.inputValue();
    const emailValue = await this.emailInput.inputValue();
    const phoneValue = await this.phoneInput.inputValue();

    return firstNameValue !== '' || lastNameValue !== '' ||
           emailValue !== '' || phoneValue !== '';
  }
}
