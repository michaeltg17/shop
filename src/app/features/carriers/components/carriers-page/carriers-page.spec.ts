import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { CarriersPage } from './carriers-page';
import { CarrierService } from '../../carrier.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, Subject } from 'rxjs';
import { Carrier } from '../../carrier';
import { ConfirmationDialog } from '../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { DialogMode } from '../../../../core/models/dialogMode';

describe('CarriersPage', () => {
  let component: CarriersPage;
  let fixture: ComponentFixture<CarriersPage>;
  let carrierService: Partial<CarrierService> & {
    carriers: WritableSignal<Carrier[]>;
    loading: WritableSignal<boolean>;
    error: WritableSignal<string | null>;
  };
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
      open: jest.fn().mockImplementation(() => {
        return createMockDialogRef().ref;
      }),
    };

    await TestBed.overrideComponent(CarriersPage, {
      remove: {
        imports: [MatDialogModule, MatSnackBarModule],
      },
    })
      .configureTestingModule({
        imports: [CarriersPage],
        providers: [
          { provide: CarrierService, useValue: carrierService },
          { provide: MatSnackBar, useValue: snackBar },
          { provide: MatDialog, useValue: dialog },
        ],
      })
      .compileComponents();

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

  it('should load carriers on init', () => {
    component.ngOnInit();
    expect(carrierService.loadCarriers).toHaveBeenCalled();
  });

  it('should call addCarrier when dialog returns a carrier', () => {
    const newCarrier: Carrier = {
      id: 0,
      name: 'New Carrier',
      trackingUrl: 'https://new.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRef = createMockDialogRef<Carrier>();
    (dialog.open as jest.Mock).mockReturnValue(mockRef.ref);

    component.openAddDialog();
    mockRef.trigger(newCarrier);

    expect(carrierService.addCarrier).toHaveBeenCalledWith(newCarrier);
    expect(snackBar.open).toHaveBeenCalledWith('Carrier added successfully', 'Close', {
      duration: 3000,
    });
  });

  it('should not add carrier when dialog closed without result', () => {
    const mockRef = createMockDialogRef<Carrier>();
    (dialog.open as jest.Mock).mockReturnValue(mockRef.ref);

    component.openAddDialog();
    mockRef.trigger(undefined);

    expect(carrierService.addCarrier).not.toHaveBeenCalled();
  });

  it('should open edit dialog and update carrier on success', () => {
    const updatedCarrier: Carrier = {
      ...mockCarrier,
      name: 'Updated Carrier',
    };

    const mockRef = createMockDialogRef<Carrier>();
    (dialog.open as jest.Mock).mockReturnValue(mockRef.ref);

    component.openEditDialog(mockCarrier);
    mockRef.trigger(updatedCarrier);

    expect(carrierService.updateCarrier).toHaveBeenCalledWith(updatedCarrier);
    expect(snackBar.open).toHaveBeenCalledWith('Carrier updated successfully', 'Close', {
      duration: 3000,
    });
  });

  it('should not update carrier when edit dialog closed without result', () => {
    const mockRef = createMockDialogRef<Carrier>();
    (dialog.open as jest.Mock).mockReturnValue(mockRef.ref);

    component.openEditDialog(mockCarrier);
    mockRef.trigger(undefined);

    expect(carrierService.updateCarrier).not.toHaveBeenCalled();
  });

  it('should open edit dialog when exactly one carrier is selected', () => {
    const mockRef = createMockDialogRef<Carrier>();
    (dialog.open as jest.Mock).mockReturnValue(mockRef.ref);

    component.selection.select(mockCarrier);
    component.editCarrier();

    expect(dialog.open).toHaveBeenCalled();
  });

  it('should not edit when no carrier selected', () => {
    component.editCarrier();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should not edit when multiple carriers selected', () => {
    const carrier1 = { ...mockCarrier };
    const carrier2 = { ...mockCarrier, id: 2, name: 'Test Carrier 2' };
    component.selection.select(carrier1, carrier2);
    component.editCarrier();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should not delete when no carriers selected', () => {
    component.deleteCarriers();
    expect(carrierService.deleteCarrier).not.toHaveBeenCalled();
  });

  it('should delete carriers when confirmed', fakeAsync(() => {
    const mockRef = createMockDialogRefBool();
    (dialog.open as jest.Mock).mockImplementation(cmp => {
      if (cmp === ConfirmationDialog) {
        return mockRef.ref;
      }
      return createMockDialogRef().ref;
    });

    component.selection.select(mockCarrier);
    component.deleteCarriers();

    expect(dialog.open).toHaveBeenCalledWith(ConfirmationDialog, {
      data: expect.objectContaining({
        message: 'Do you really want to delete 1 carrier(s)?',
      }),
    });

    mockRef.trigger(true);
    tick();

    expect(carrierService.deleteCarrier).toHaveBeenCalledWith(mockCarrier.id);
  }));

  it('should not delete carriers when not confirmed', fakeAsync(() => {
    const mockRef = createMockDialogRefBool();
    (dialog.open as jest.Mock).mockImplementation(cmp => {
      if (cmp === ConfirmationDialog) {
        return mockRef.ref;
      }
      return createMockDialogRef().ref;
    });

    component.selection.select(mockCarrier);
    component.deleteCarriers();
    mockRef.trigger(false);
    tick();

    expect(carrierService.deleteCarrier).not.toHaveBeenCalled();
  }));

  it('should show correct count in delete confirmation message', fakeAsync(() => {
    const mockRef = createMockDialogRefBool();
    (dialog.open as jest.Mock).mockImplementation(cmp => {
      if (cmp === ConfirmationDialog) {
        return mockRef.ref;
      }
      return createMockDialogRef().ref;
    });

    const carrier2 = { ...mockCarrier, id: 2 };
    component.selection.select(mockCarrier, carrier2);
    component.deleteCarriers();

    expect(dialog.open).toHaveBeenCalledWith(ConfirmationDialog, {
      data: expect.objectContaining({
        message: 'Do you really want to delete 2 carrier(s)?',
      }),
    });
    tick();
  }));

  it('should set dataSource data from carriers signal', () => {
    const carriers: Carrier[] = [mockCarrier];
    carrierService.carriers.set(carriers);
    fixture.detectChanges();
    expect(component.dataSource.data).toEqual(carriers);
  });

  it('should expose loading signal from service', () => {
    expect(component.loading).toBe(carrierService.loading);
  });

  it('should expose error signal from service', () => {
    expect(component.error).toBe(carrierService.error);
  });

  it('should expose carriers signal from service', () => {
    expect(component.carriers).toBe(carrierService.carriers);
  });

  it('should open add dialog with correct panelClass and closeOnNavigation', () => {
    const mockRef = createMockDialogRef<Carrier>();
    (dialog.open as jest.Mock).mockReturnValue(mockRef.ref);

    component.openAddDialog();

    expect(dialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        panelClass: 'carrier-dialog',
        closeOnNavigation: false,
      })
    );
  });

  it('should open edit dialog with carrier data', () => {
    const mockRef = createMockDialogRef<Carrier>();
    (dialog.open as jest.Mock).mockReturnValue(mockRef.ref);

    component.openEditDialog(mockCarrier);

    expect(dialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: { mode: DialogMode.Edit, carrier: mockCarrier },
        panelClass: 'carrier-dialog',
        closeOnNavigation: false,
      })
    );
  });

  it('should show snackbar with error message via error effect', () => {
    (carrierService.error as WritableSignal<string | null>).set('Test error');
    fixture.detectChanges();
    expect(snackBar.open).toHaveBeenCalledWith('Test error', 'Close', { duration: 4000 });
  });

  it('should call markForCheck when carriers signal changes', () => {
    const markForCheckSpy = jest.spyOn(component['changeDetectorRef'], 'markForCheck');
    carrierService.carriers.set([mockCarrier]);
    fixture.detectChanges();
    expect(markForCheckSpy).toHaveBeenCalled();
  });

  it('should have correct column labels', () => {
    expect(component.columns[0].label).toBe('ID');
    expect(component.columns[1].label).toBe('Name');
    expect(component.columns[2].label).toBe('Tracking URL');
    expect(component.columns[3].label).toBe('Active');
    expect(component.columns[4].label).toBe('Created');
    expect(component.columns[5].label).toBe('Updated');
  });
});
