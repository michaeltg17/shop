import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarrierDialog } from './carrier-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Carrier } from '../../carrier';

describe('CarrierDialog', () => {
  let component: CarrierDialog;
  let fixture: ComponentFixture<CarrierDialog>;
  let dialogRefSpy: Partial<MatDialogRef<CarrierDialog>>;

  const mockCarrier: Carrier = {
    id: 1,
    name: 'Test Carrier',
    trackingUrl: 'https://example.com',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    dialogRefSpy = {
      close: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CarrierDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { carrier: undefined } },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    fixture = TestBed.createComponent(CarrierDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize isEditing to false for new carrier', () => {
    fixture = TestBed.createComponent(CarrierDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.isEditing).toBe(false);
  });

  it('should have carrierForm initialized', () => {
    fixture = TestBed.createComponent(CarrierDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.ngOnInit();
    expect(component.carrierForm).toBeDefined();
  });

  it('should close dialog with data on valid submit', () => {
    fixture = TestBed.createComponent(CarrierDialog);
    component = fixture.componentInstance;
    component.ngOnInit();
    component.carrierForm.patchValue({ name: 'Test', trackingUrl: 'https://test.com', isActive: true });
    component.onSubmit();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should not close dialog on invalid submit', () => {
    dialogRefSpy.close = vi.fn();
    fixture = TestBed.createComponent(CarrierDialog);
    component = fixture.componentInstance;
    component.ngOnInit();
    component.onSubmit();
    expect(dialogRefSpy.close).not.toHaveBeenCalled();
  });

  it('should close dialog on cancel', () => {
    dialogRefSpy.close = vi.fn();
    fixture = TestBed.createComponent(CarrierDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});