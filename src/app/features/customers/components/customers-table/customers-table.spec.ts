import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CustomersTable } from './customers-table';
import { CustomerService } from '../../customer.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { PendingChangesService } from '../../../../core/services/pending-changes.service';
import { of } from 'rxjs';

describe('CustomersTable', () => {
  let component: CustomersTable;
  let fixture: ComponentFixture<CustomersTable>;
  let customerService: Partial<CustomerService>;
  let snackBar: Partial<MatSnackBar>;
  let dialog: Partial<MatDialog>;
  let route: ActivatedRoute;
  let router: Partial<Router>;
  let pendingService: Partial<PendingChangesService>;

  beforeEach(async () => {
    customerService = {
      loadCustomers: vi.fn(),
      addCustomer: vi.fn(),
      updateCustomer: vi.fn(),
      deleteCustomers: vi.fn(),
      customers: signal([]),
      loading: signal(false),
      error: signal<string | null>(null),
    };

    snackBar = {
      open: vi.fn(),
    };

    dialog = {
      open: vi.fn(),
      afterClosed: vi.fn().mockReturnValue({ subscribe: (fn: Function) => fn() }),
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
      navigate: vi.fn(),
      routerState: routerState as any,
      events: of(),
    };

    pendingService = {
      clear: vi.fn(),
      clearActiveDialog: vi.fn(),
      setActiveDialog: vi.fn(),
      setPending: vi.fn(),
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
    expect(component.columns.length).toBeGreaterThan(0);
  });

  it('should load customers on init', () => {
    component.ngOnInit();
    expect(customerService.loadCustomers).toHaveBeenCalled();
  });

  it('should apply filter', () => {
    component.applyFilter('test');
    expect(component.filterValue).toBe('test');
  });

  it('should check if all selected', () => {
    expect(component.isAllSelected()).toBe(true);
  });

  it('should toggle all rows', () => {
    component.toggleAllRows();
  });
});