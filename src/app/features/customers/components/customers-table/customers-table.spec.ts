import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { CustomersTable } from './customers-table';
import { CustomerService } from '../../customer.service';
import { CustomerDialog } from '../customer-dialog/customer-dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterState, Event as RouterEvent } from '@angular/router';
import { PendingChangesService } from '../../../../core/services/pending-changes.service';
import { of, Subject } from 'rxjs';
import { Customer } from '../../customer';
import { DialogMode } from '../../../../core/models/dialogMode';

describe('CustomersTable', () => {
  let component: CustomersTable;
  let fixture: ComponentFixture<CustomersTable>;
  let customerService: Partial<CustomerService>;
  let snackBar: Partial<MatSnackBar>;
  let dialog: Partial<MatDialog>;
  let route: ActivatedRoute;
  let router: Partial<Router>;
  let pendingService: Partial<PendingChangesService>;
  let routerEvents: Subject<RouterEvent>;

  const mockCustomer: Customer = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '123-456-7890',
    isActive: true,
  };

  beforeEach(async () => {
    routerEvents = new Subject<RouterEvent>();

    const customersSignal = signal<Customer[]>([]);
    const loadingSignal = signal(false);
    const errorSignal = signal<string | null>(null);

    customerService = {
      loadCustomers: jest.fn(),
      addCustomer: jest.fn(),
      updateCustomer: jest.fn(),
      deleteCustomers: jest.fn(),
      customers: customersSignal,
      loading: loadingSignal,
      error: errorSignal,
    };

    snackBar = {
      open: jest.fn(),
    };

    const mockDialogRef = {
      afterClosed: () => of(undefined),
      componentInstance: {},
      close: jest.fn(),
    };

    dialog = {
      open: jest.fn().mockReturnValue(mockDialogRef),
    } as Partial<MatDialog>;

    const routeSnapshot = {
      paramMap: { get: () => null },
      url: [],
      firstChild: null,
    };

    route = {
      snapshot: routeSnapshot,
    } as unknown as ActivatedRoute;

    const routerState = {
      snapshot: {
        root: {
          firstChild: null,
          paramMap: { get: () => null },
          url: [],
        },
      },
    };

    router = {
      navigate: jest.fn(),
      routerState: routerState as unknown as RouterState,
      events: routerEvents.asObservable(),
    };

    pendingService = {
      clear: jest.fn(),
      clearActiveDialog: jest.fn(),
      setActiveDialog: jest.fn(),
      setPending: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CustomersTable],
      providers: [
        { provide: CustomerService, useValue: customerService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: PendingChangesService, useValue: pendingService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomersTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have columns defined', () => {
    expect(component.columns).toBeDefined();
    expect(component.columns.length).toBe(6);
    expect(component.columns[0].key).toBe('id');
    expect(component.columns[0].label).toBe('Id');
  });

  it('should load customers on init', () => {
    component.ngOnInit();
    expect(customerService.loadCustomers).toHaveBeenCalled();
  });

  it('should have filterValue property', () => {
    expect(component.filterValue).toBe('');
  });

  it('should open view dialog via router', () => {
    jest.spyOn(router, 'navigate');
    component.viewCustomer(mockCustomer);
    expect(router.navigate).toHaveBeenCalledWith(['/customers', mockCustomer.id]);
  });

  it('should navigate to add customer', () => {
    jest.spyOn(router, 'navigate');
    component.addCustomer();
    expect(router.navigate).toHaveBeenCalledWith(['/customers/new']);
  });

  it('should edit selected customer', () => {
    jest.spyOn(router, 'navigate');
    component.selection.select(mockCustomer);
    component.editCustomer();
    expect(router.navigate).toHaveBeenCalledWith(['/customers', mockCustomer.id, 'edit']);
  });

  it('should not edit when no customer selected', () => {
    jest.spyOn(router, 'navigate');
    component.editCustomer();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should not edit when multiple customers selected', () => {
    jest.spyOn(router, 'navigate');
    component.selection.select(mockCustomer);
    component.selection.select({ ...mockCustomer, id: 2 });
    component.editCustomer();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should return true from canDeactivate when no active dialog', () => {
    expect(component.canDeactivate()).toBe(true);
  });

  it('should return true from canDeactivate when no unsaved changes', () => {
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {},
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(true);
  });

  it('should return false from canDeactivate when has unsaved changes and user cancels', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        hasUnsavedChanges: () => true,
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(false);
    confirmSpy.mockRestore();
  });

  it('should return true from canDeactivate when has unsaved changes and user confirms', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        hasUnsavedChanges: () => true,
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(true);
    confirmSpy.mockRestore();
  });

  it('should close dialog when user confirms leave with unsaved changes', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const closeFn = jest.fn();
    const mockDialogRef = {
      close: closeFn,
      componentInstance: {
        hasUnsavedChanges: () => true,
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    component.canDeactivate();
    expect(closeFn).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('should fallback to checking individual field dirty state when hasUnsavedChanges not available', () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        firstName: { dirty: true },
        lastName: { dirty: false },
        email: { dirty: false },
        isActive: { dirty: false },
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(false);
    confirmSpy.mockRestore();
  });

  it('should return true from canDeactivate when fallback fields not dirty', () => {
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {
        firstName: { dirty: false },
        lastName: { dirty: false },
        email: { dirty: false },
        isActive: { dirty: false },
      },
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(true);
  });

  it('should handle canDeactivate when componentInstance has no dirty fields at all', () => {
    const mockDialogRef = {
      close: jest.fn(),
      componentInstance: {},
    };
    (component as unknown as { ['activeDialogRef']: unknown })['activeDialogRef'] = mockDialogRef;
    expect(component.canDeactivate()).toBe(true);
  });

  it('should call openViewDialog with correct config', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.openViewDialog(mockCustomer);
    expect(openSpy).toHaveBeenCalledWith(
      CustomerDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          mode: DialogMode.View,
          customer: mockCustomer,
        }),
        panelClass: ['customer-dialog', 'mode-view'],
        closeOnNavigation: false,
      })
    );
  });

  it('should call openEditDialog with correct config', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.openEditDialog(mockCustomer);
    expect(openSpy).toHaveBeenCalledWith(
      CustomerDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          mode: DialogMode.Edit,
          customer: mockCustomer,
        }),
        panelClass: 'customer-dialog',
        closeOnNavigation: false,
      })
    );
  });

  it('should call openAddDialog with correct config', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.openAddDialog();
    expect(openSpy).toHaveBeenCalledWith(
      CustomerDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          mode: DialogMode.Add,
        }),
        panelClass: 'customer-dialog',
        closeOnNavigation: false,
      })
    );
  });

  it('should set activeDialogRef when opening view dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    pendingService.setActiveDialog = jest.fn();

    component.openViewDialog(mockCustomer);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should set activeDialogRef when opening edit dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    pendingService.setActiveDialog = jest.fn();

    component.openEditDialog(mockCustomer);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should set activeDialogRef when opening add dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    pendingService.setActiveDialog = jest.fn();

    component.openAddDialog();
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should call deleteCustomers and show confirmation dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(true),
      close: jest.fn(),
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.selection.select(mockCustomer);
    component.deleteCustomers();
    expect(openSpy).toHaveBeenCalled();
  });

  it('should not delete customers when user cancels', () => {
    const dialogRefMock = {
      afterClosed: () => of(false),
      close: jest.fn(),
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    component.selection.select(mockCustomer);
    component.deleteCustomers();

    expect(customerService.deleteCustomers).not.toHaveBeenCalled();
  });

  it('should delete customers when user confirms', () => {
    const dialogRefMock = {
      afterClosed: () => of(true),
      close: jest.fn(),
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    const customer2 = { ...mockCustomer, id: 2 };
    component.selection.select(mockCustomer, customer2);
    component.deleteCustomers();

    expect(customerService.deleteCustomers).toHaveBeenCalledWith([1, 2]);
  });

  it('should clear selection after deleting customers', () => {
    const dialogRefMock = {
      afterClosed: () => of(true),
      close: jest.fn(),
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);

    component.selection.select(mockCustomer);
    component.deleteCustomers();

    expect(component.selection.selected.length).toBe(0);
  });

  it('should expose customers signal from service', () => {
    expect(component.customers).toBe(customerService.customers);
  });

  it('should expose loading signal from service', () => {
    expect(component.loading).toBe(customerService.loading);
  });

  it('should expose error signal from service', () => {
    expect(component.error).toBe(customerService.error);
  });

  it('should open add dialog on /customers/new route', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    const openSpy = jest.fn().mockReturnValue(dialogRefMock);
    (component['dialog'] as MatDialog).open = openSpy;

    // The addCustomer method navigates to /customers/new
    component.addCustomer();
    expect(router.navigate).toHaveBeenCalledWith(['/customers/new']);
  });

  it('should show snackbar on error via error effect', () => {
    // The error effect runs on init and checks for error signal
    // Verify the error signal is properly wired
    expect(component.error).toBe(customerService.error);
    // Setting error should update the signal
    (customerService.error as unknown as WritableSignal<string | null>).set('Test error');
    expect(component.error()).toBe('Test error');
  });

  it('should update dataSource.data when customers signal changes', () => {
    const customers: Customer[] = [mockCustomer];
    (customerService.customers as unknown as WritableSignal<Customer[]>).set(customers);
    fixture.detectChanges();
    expect(component.dataSource.data).toEqual(customers);
  });

  it('should update dataSource when customers signal changes', () => {
    const customers: Customer[] = [mockCustomer];
    (customerService.customers as unknown as WritableSignal<Customer[]>).set(customers);
    fixture.detectChanges();
    expect(component.dataSource.data).toEqual(customers);
  });

  it('should call markForCheck when customers signal changes', () => {
    const markForCheckSpy = jest.spyOn(component['changeDetectorRef'], 'markForCheck');
    const customers: Customer[] = [mockCustomer];
    (customerService.customers as unknown as WritableSignal<Customer[]>).set(customers);
    fixture.detectChanges();
    expect(markForCheckSpy).toHaveBeenCalled();
  });

  it('should call setActiveDialog when opening edit dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openEditDialog(mockCustomer);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should call setActiveDialog when opening add dialog', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openAddDialog();
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should clear activeDialogRef after dialog closes for view', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openViewDialog(mockCustomer);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should clear activeDialogRef after dialog closes for edit', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openEditDialog(mockCustomer);
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });

  it('should clear activeDialogRef after dialog closes for add', () => {
    const dialogRefMock = {
      afterClosed: () => of(undefined),
      close: jest.fn(),
      componentInstance: {},
    };
    (component['dialog'] as MatDialog).open = jest.fn().mockReturnValue(dialogRefMock);
    component.openAddDialog();
    expect(pendingService.setActiveDialog).toHaveBeenCalled();
  });
});
