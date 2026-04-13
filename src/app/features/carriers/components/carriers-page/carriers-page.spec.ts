import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CarriersPage } from './carriers-page';
import { CarrierService } from '../../carrier.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

describe('CarriersPage', () => {
  let component: CarriersPage;
  let fixture: ComponentFixture<CarriersPage>;
  let carrierService: Partial<CarrierService>;
  let snackBar: Partial<MatSnackBar>;
  let dialog: Partial<MatDialog>;

  beforeEach(async () => {
    carrierService = {
      loadCarriers: vi.fn(),
      addCarrier: vi.fn(),
      updateCarrier: vi.fn(),
      deleteCarrier: vi.fn(),
      carriers: signal([]),
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

    await TestBed.configureTestingModule({
      imports: [CarriersPage],
      providers: [
        { provide: CarrierService, useValue: carrierService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CarriersPage);
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

  it('should load carriers on init', () => {
    component.ngOnInit();
    expect(carrierService.loadCarriers).toHaveBeenCalled();
  });

  it('should apply filter', () => {
    component.applyFilter('test');
    expect(component.filterValue).toBe('test');
  });

  it('should check if all selected', () => {
    // With no data rows, isAllSelected returns true (0 === 0)
    expect(component.isAllSelected()).toBe(true);
  });

  it('should toggle all rows', () => {
    component.toggleAllRows();
  });

  it('should check if column is date column', () => {
    expect(component.isDateColumn('createdAt')).toBe(true);
    expect(component.isDateColumn('name')).toBe(false);
  });

  it('should check if column is boolean column', () => {
    expect(component.isBooleanColumn('isActive')).toBe(true);
    expect(component.isBooleanColumn('name')).toBe(false);
  });
});