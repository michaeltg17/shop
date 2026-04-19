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
  });

  it('should have displayed columns including select', () => {
    expect(component.displayedColumns).toContain('select');
    expect(component.displayedColumns).toContain('id');
  });

  it('should load customers on init', () => {
    component.ngOnInit();
    expect(customerService.loadCustomers).toHaveBeenCalled();
  });

  it('should apply filter with trim and lowercase', () => {
    component.applyFilter('  TEST  ');
    expect(component.filterValue).toBe('test');
  });

  it('should return true when all rows are selected', () => {
    const customers: Customer[] = [mockCustomer];
    (customerService.customers as unknown as WritableSignal<Customer[]>).set(customers);
    component.dataSource.data = customers;
    component.selection.select(mockCustomer);
    expect(component.isAllSelected()).toBe(true);
  });

  it('should return false when not all rows are selected', () => {
    expect(component.isAllSelected()).toBe(true);
    const customers: Customer[] = [mockCustomer, { ...mockCustomer, id: 2 }];
    (customerService.customers as unknown as WritableSignal<Customer[]>).set(customers);
    component.dataSource.data = customers;
    component.selection.clear();
    expect(component.isAllSelected()).toBe(false);
  });

  it('should toggle all rows - select all', () => {
    const customers: Customer[] = [mockCustomer];
    (customerService.customers as unknown as WritableSignal<Customer[]>).set(customers);
    component.dataSource.data = customers;
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(1);
  });

  it('should toggle all rows - deselect all', () => {
    const customers: Customer[] = [mockCustomer];
    (customerService.customers as unknown as WritableSignal<Customer[]>).set(customers);
    component.dataSource.data = customers;
    component.selection.select(mockCustomer);
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should open view dialog', () => {
    jest.spyOn(router, 'navigate');
    component.viewCustomer(mockCustomer);
    expect(router.navigate).toHaveBeenCalledWith(['/customers', mockCustomer.id]);
  });

  it('should open add dialog', () => {
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

  it('should call openViewDialog', () => {
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

  it('should call openEditDialog', () => {
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

  it('should call openAddDialog', () => {
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
});
