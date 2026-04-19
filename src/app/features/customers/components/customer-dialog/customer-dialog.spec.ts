import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerDialog } from './customer-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PendingChangesService } from '../../../../core/services/pending-changes.service';
import { DialogMode } from '../../../../core/models/dialogMode';

describe('CustomerDialog', () => {
  let component: CustomerDialog;
  let fixture: ComponentFixture<CustomerDialog>;
  let dialogRefSpy: Partial<MatDialogRef<CustomerDialog>>;
  let pendingService: Partial<PendingChangesService>;

  beforeEach(async () => {
    dialogRefSpy = {
      close: jest.fn(),
      disableClose: false,
    };
    pendingService = {
      setPending: jest.fn(),
      clear: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CustomerDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { mode: DialogMode.Add } },
        { provide: PendingChangesService, useValue: pendingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have firstName control initialized', () => {
    expect(component.firstName).toBeDefined();
  });

  it('should have lastName control initialized', () => {
    expect(component.lastName).toBeDefined();
  });

  it('should have email control initialized', () => {
    expect(component.email).toBeDefined();
  });

  it('should have phoneNumber control initialized', () => {
    expect(component.phoneNumber).toBeDefined();
  });

  it('should have isActive control initialized', () => {
    expect(component.isActive).toBeDefined();
  });

  it('should be valid when all required fields are filled', () => {
    component.firstName.setValue('John');
    component.lastName.setValue('Doe');
    component.email.setValue('john@example.com');
    expect(component.isValid()).toBe(true);
  });

  it('should be invalid when required fields are empty', () => {
    component.firstName.setValue('');
    component.lastName.setValue('');
    component.email.setValue('');
    expect(component.isValid()).toBe(false);
  });

  it('should close dialog with customer data on save', () => {
    component.firstName.setValue('John');
    component.lastName.setValue('Doe');
    component.email.setValue('john@example.com');
    component.save();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should not close dialog on invalid save', () => {
    jest.clearAllMocks();
    component.save();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should close dialog on cancel', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should check for unsaved changes', () => {
    expect(component.hasUnsavedChanges()).toBe(false);
    component.firstName.markAsDirty();
    expect(component.hasUnsavedChanges()).toBe(true);
  });
});

describe('CustomerDialog View Mode', () => {
  let component: CustomerDialog;
  let fixture: ComponentFixture<CustomerDialog>;
  let dialogRefSpy: Partial<MatDialogRef<CustomerDialog>>;
  let pendingService: Partial<PendingChangesService>;

  beforeEach(async () => {
    dialogRefSpy = {
      close: jest.fn(),
      disableClose: false,
    };
    pendingService = {
      setPending: jest.fn(),
      clear: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CustomerDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            mode: DialogMode.View,
            customer: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              phoneNumber: '123',
              isActive: true,
            },
          },
        },
        { provide: PendingChangesService, useValue: pendingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable all controls in View mode', () => {
    expect(component.firstName.disabled).toBe(true);
    expect(component.lastName.disabled).toBe(true);
    expect(component.email.disabled).toBe(true);
    expect(component.isActive.disabled).toBe(true);
    expect(component.phoneNumber.disabled).toBe(true);
  });
});
