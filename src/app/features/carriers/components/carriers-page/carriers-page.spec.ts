import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { CarriersPage } from './carriers-page';
import { CarrierService } from '../../carrier.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { Carrier } from '../../carrier';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';

describe('CarriersPage', () => {
  let component: CarriersPage;
  let fixture: ComponentFixture<CarriersPage>;
  let carrierService: Partial<CarrierService>;
  let snackBar: Partial<MatSnackBar>;
  let dialog: Partial<MatDialog>;

  const mockCarrier: Carrier = {
    id: 1,
    name: 'Test Carrier',
    trackingUrl: 'https://example.com/tracking',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  const createMockDialogRef = <T>(): { ref: MatDialogRef<T>; trigger: (result?: T) => void } => {
    const afterClosedSubject = new Subject<T>();
    const ref = {
      afterClosed: () => afterClosedSubject.asObservable(),
      afterDismissed: () => of(undefined),
      close: (res?: T) => {
        afterClosedSubject.next(res);
        afterClosedSubject.complete();
      },
      dismiss: () => afterClosedSubject.complete(),
      updateSize: jest.fn(),
      addPanelClass: jest.fn(),
      removePanelClass: jest.fn(),
      hasPanelClass: () => false,
    } as MatDialogRef<T>;
    return {
      ref,
      trigger: (result?: T) => {
        afterClosedSubject.next(result);
        afterClosedSubject.complete();
      },
    };
  };

  const createMockDialogRefBool = (): {
    ref: MatDialogRef<boolean>;
    trigger: (result?: boolean) => void;
  } => {
    const afterClosedSubject = new Subject<boolean>();
    const ref = {
      afterClosed: () => afterClosedSubject.asObservable(),
      afterDismissed: () => of(undefined),
      close: (res?: boolean) => {
        afterClosedSubject.next(res);
        afterClosedSubject.complete();
      },
      dismiss: () => afterClosedSubject.complete(),
      updateSize: jest.fn(),
      addPanelClass: jest.fn(),
      removePanelClass: jest.fn(),
      hasPanelClass: () => false,
    } as MatDialogRef<boolean>;
    return {
      ref,
      trigger: (result?: boolean) => {
        afterClosedSubject.next(result);
        afterClosedSubject.complete();
      },
    };
  };

  beforeEach(async () => {
    const carriersSignal = signal<Carrier[]>([]);
    const loadingSignal = signal(false);
    const errorSignal = signal<string | null>(null);

    carrierService = {
      loadCarriers: jest.fn(),
      addCarrier: jest.fn(),
      updateCarrier: jest.fn(),
      deleteCarrier: jest.fn(),
      carriers: carriersSignal,
      loading: loadingSignal,
      error: errorSignal,
    };

    snackBar = {
      open: jest.fn(),
    };

    dialog = {
      open: jest.fn().mockImplementation(component => {
        if (component === ConfirmationDialog) {
          const result = createMockDialogRefBool();
          return result.ref;
        }
        const result = createMockDialogRef();
        return result.ref;
      }),
    };

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
    expect(component.columns.length).toBe(6);
    expect(component.columns[0].key).toBe('id');
  });

  it('should have displayed columns including select', () => {
    expect(component.displayedColumns).toContain('select');
    expect(component.displayedColumns).toContain('id');
  });

  it('should load carriers on init', () => {
    component.ngOnInit();
    expect(carrierService.loadCarriers).toHaveBeenCalled();
  });

  it('should apply filter with trim and lowercase', () => {
    component.applyFilter('  TEST  ');
    expect(component.filterValue).toBe('test');
  });

  it('should check if all selected - all selected', () => {
    const carriers: Carrier[] = [mockCarrier];
    (carrierService.carriers as unknown as WritableSignal<Carrier[]>).set(carriers);
    component.dataSource.data = carriers;
    component.selection.select(mockCarrier);
    expect(component.isAllSelected()).toBe(true);
  });

  it('should check if all selected - none selected', () => {
    const carriers: Carrier[] = [mockCarrier, { ...mockCarrier, id: 2 }];
    (carrierService.carriers as unknown as WritableSignal<Carrier[]>).set(carriers);
    component.dataSource.data = carriers;
    component.selection.clear();
    expect(component.isAllSelected()).toBe(false);
  });

  it('should toggle all rows - select all', () => {
    const carriers: Carrier[] = [mockCarrier];
    (carrierService.carriers as unknown as WritableSignal<Carrier[]>).set(carriers);
    component.dataSource.data = carriers;
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(1);
  });

  it('should toggle all rows - deselect all', () => {
    const carriers: Carrier[] = [mockCarrier];
    (carrierService.carriers as unknown as WritableSignal<Carrier[]>).set(carriers);
    component.dataSource.data = carriers;
    component.selection.select(mockCarrier);
    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should check if column is date column', () => {
    expect(component.isDateColumn('createdAt')).toBe(true);
    expect(component.isDateColumn('updatedAt')).toBe(true);
    expect(component.isDateColumn('name')).toBe(false);
  });

  it('should check if column is boolean column', () => {
    expect(component.isBooleanColumn('isActive')).toBe(true);
    expect(component.isBooleanColumn('name')).toBe(false);
  });

  it('should not edit when no carrier selected', () => {
    component.editCarrier();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should not edit when multiple carriers selected', () => {
    const carrier1 = { ...mockCarrier };
    const carrier2 = { ...mockCarrier, id: 2, name: 'Test Carrier 2' };
    component.dataSource.data = [carrier1, carrier2];
    component.selection.select(carrier1, carrier2);
    component.editCarrier();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should not delete when no carriers selected', () => {
    component.deleteCarriers();
    expect(carrierService.deleteCarrier).not.toHaveBeenCalled();
  });
});
