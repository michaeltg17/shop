import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDialog } from './user-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PendingChangesService } from '../../../../core/services/pending-changes.service';
import { DialogMode } from '../../../../core/models/dialogMode';

describe('UserDialog', () => {
  let component: UserDialog;
  let fixture: ComponentFixture<UserDialog>;
  let dialogRefSpy: Partial<MatDialogRef<UserDialog>>;
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
      imports: [UserDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { mode: DialogMode.Add } },
        { provide: PendingChangesService, useValue: pendingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDialog);
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

  it('should initialize firstName with empty value in Add mode', () => {
    expect(component.firstName.value).toBe('');
  });

  it('should initialize lastName with empty value in Add mode', () => {
    expect(component.lastName.value).toBe('');
  });

  it('should initialize email with empty value in Add mode', () => {
    expect(component.email.value).toBe('');
  });

  it('should initialize phoneNumber with empty value in Add mode', () => {
    expect(component.phoneNumber.value).toBe('');
  });

  it('should initialize isActive with true in Add mode', () => {
    expect(component.isActive.value).toBe(true);
  });

  it('should be valid when all required fields are filled', () => {
    component.firstName.setValue('John');
    component.lastName.setValue('Doe');
    component.email.setValue('john@example.com');
    expect(component.isValid()).toBe(true);
  });

  it('should be invalid when firstName is empty', () => {
    component.firstName.setValue('');
    component.lastName.setValue('Doe');
    component.email.setValue('john@example.com');
    expect(component.isValid()).toBe(false);
  });

  it('should be invalid when lastName is empty', () => {
    component.firstName.setValue('John');
    component.lastName.setValue('');
    component.email.setValue('john@example.com');
    expect(component.isValid()).toBe(false);
  });

  it('should be invalid when email is empty', () => {
    component.firstName.setValue('John');
    component.lastName.setValue('Doe');
    component.email.setValue('');
    expect(component.isValid()).toBe(false);
  });

  it('should be invalid when email is malformed', () => {
    component.firstName.setValue('John');
    component.lastName.setValue('Doe');
    component.email.setValue('not-an-email');
    expect(component.isValid()).toBe(false);
  });

  it('should close dialog with user data on save', () => {
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

  it('should return false for hasUnsavedChanges when no fields are dirty', () => {
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('should detect dirty lastName as unsaved change', () => {
    component.lastName.markAsDirty();
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('should detect dirty email as unsaved change', () => {
    component.email.markAsDirty();
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('should detect dirty isActive as unsaved change', () => {
    component.isActive.markAsDirty();
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('should set disableClose on field changes via valueChanges', () => {
    // markAsDirty sets dirty state, then setValue triggers valueChanges which fires markDisable
    component.firstName.markAsDirty();
    component.firstName.setValue('John');
    // markDisable checks dirty state and sets disableClose accordingly
    expect(component.firstName.dirty).toBe(true);
    expect(dialogRefSpy.disableClose).toBe(true);
  });

  it('should call pendingService.setPending on field changes', () => {
    component.firstName.setValue('John');
    expect(pendingService.setPending).toHaveBeenCalled();
  });

  it('should call pendingService.clear on destroy', () => {
    component.ngOnDestroy();
    expect(pendingService.clear).toHaveBeenCalled();
  });

  it('should save user with correct data structure', () => {
    component.firstName.setValue('Jane');
    component.lastName.setValue('Smith');
    component.email.setValue('jane@test.com');
    component.phoneNumber.setValue('555-1234');
    component.isActive.setValue(false);
    component.save();

    expect(dialogRefSpy.close).toHaveBeenCalledWith({
      id: 0,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@test.com',
      isActive: false,
      phoneNumber: '555-1234',
    });
  });

  it('should have firstName with required validator', () => {
    component.firstName.setValue('');
    expect(component.firstName.errors).toBeTruthy();
    expect(component.firstName.errors?.['required']).toBe(true);
  });

  it('should have email with required and email validators', () => {
    component.email.setValue('');
    expect(component.email.errors?.['required']).toBe(true);

    component.email.setValue('invalid');
    expect(component.email.errors?.['email']).toBe(true);
  });

  it('should expose dialogMode enum', () => {
    expect(component.dialogMode).toBe(DialogMode);
  });
});

describe('UserDialog View Mode', () => {
  let component: UserDialog;
  let fixture: ComponentFixture<UserDialog>;
  let dialogRefSpy: Partial<MatDialogRef<UserDialog>>;
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
      imports: [UserDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            mode: DialogMode.View,
            user: {
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

    fixture = TestBed.createComponent(UserDialog);
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

  it('should initialize firstName with user data in View mode', () => {
    expect(component.firstName.value).toBe('John');
  });

  it('should initialize lastName with user data in View mode', () => {
    expect(component.lastName.value).toBe('Doe');
  });

  it('should initialize email with user data in View mode', () => {
    expect(component.email.value).toBe('john@example.com');
  });

  it('should initialize phoneNumber with user data in View mode', () => {
    expect(component.phoneNumber.value).toBe('123');
  });

  it('should have isActive disabled in View mode', () => {
    expect(component.isActive.disabled).toBe(true);
  });

  it('should not allow save in View mode since controls are disabled', () => {
    // In view mode, controls are disabled so valid check should fail
    jest.clearAllMocks();
    component.save();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should still allow cancel in View mode', () => {
    component.cancel();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});

describe('UserDialog Edit Mode', () => {
  let component: UserDialog;
  let fixture: ComponentFixture<UserDialog>;
  let dialogRefSpy: Partial<MatDialogRef<UserDialog>>;
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
      imports: [UserDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            mode: DialogMode.Edit,
            user: {
              id: 5,
              firstName: 'Existing',
              lastName: 'Customer',
              email: 'existing@test.com',
              phoneNumber: '999',
              isActive: false,
            },
          },
        },
        { provide: PendingChangesService, useValue: pendingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create in edit mode', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize controls with existing user data', () => {
    expect(component.firstName.value).toBe('Existing');
    expect(component.lastName.value).toBe('Customer');
    expect(component.email.value).toBe('existing@test.com');
    expect(component.phoneNumber.value).toBe('999');
  });

  it('should not disable controls in Edit mode', () => {
    expect(component.firstName.disabled).toBe(false);
    expect(component.lastName.disabled).toBe(false);
    expect(component.email.disabled).toBe(false);
    expect(component.isActive.disabled).toBe(false);
    expect(component.phoneNumber.disabled).toBe(false);
  });

  it('should save with existing user id', () => {
    component.save();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        firstName: 'Existing',
        lastName: 'Customer',
      })
    );
  });

  it('should allow modifying and saving updated values', () => {
    component.firstName.setValue('Updated');
    component.lastName.setValue('Name');
    component.save();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: 'Updated',
        lastName: 'Name',
      })
    );
  });
});
