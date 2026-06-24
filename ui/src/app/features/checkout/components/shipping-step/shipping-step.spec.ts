import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ShippingStep } from './shipping-step';
import { CheckoutService } from '../../services/checkout.service';

describe('ShippingStep', () => {
  let component: ShippingStep;
  let fixture: ComponentFixture<ShippingStep>;
  let checkoutService: CheckoutService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ShippingStep, FormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ShippingStep);
    component = fixture.componentInstance;
    checkoutService = TestBed.inject(CheckoutService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load shipping data from checkoutService', () => {
      checkoutService.updateShipping({
        name: 'Jane Doe',
        addressLine1: '456 Oak Ave',
        addressLine2: 'Suite 2B',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
        country: 'US',
      });

      fixture.detectChanges();

      expect(component.name).toBe('Jane Doe');
      expect(component.addressLine1).toBe('456 Oak Ave');
      expect(component.addressLine2).toBe('Suite 2B');
      expect(component.city).toBe('Chicago');
      expect(component.state).toBe('IL');
      expect(component.zip).toBe('60601');
      expect(component.country).toBe('US');
    });

    it('should start with empty fields by default', () => {
      fixture.detectChanges();
      expect(component.name).toBe('');
      expect(component.addressLine1).toBe('');
      expect(component.addressLine2).toBe('');
      expect(component.city).toBe('');
      expect(component.state).toBe('');
      expect(component.zip).toBe('');
      expect(component.country).toBe('');
    });
  });

  describe('update()', () => {
    it('should push all fields to checkoutService', () => {
      component.name = 'Bob Smith';
      component.addressLine1 = '789 Elm St';
      component.addressLine2 = 'Floor 3';
      component.city = 'Boston';
      component.state = 'MA';
      component.zip = '02101';
      component.country = 'US';

      component.update();

      const shipping = checkoutService.getShipping();
      expect(shipping.name).toBe('Bob Smith');
      expect(shipping.addressLine1).toBe('789 Elm St');
      expect(shipping.addressLine2).toBe('Floor 3');
      expect(shipping.city).toBe('Boston');
      expect(shipping.state).toBe('MA');
      expect(shipping.zip).toBe('02101');
      expect(shipping.country).toBe('US');
    });

    it('should send all component fields (including empty ones) on update', () => {
      component.city = 'Los Angeles';
      component.state = 'CA';
      component.update();

      const shipping = checkoutService.getShipping();
      expect(shipping.city).toBe('Los Angeles');
      expect(shipping.state).toBe('CA');
      expect(shipping.name).toBe('');
      expect(shipping.addressLine1).toBe('');
    });

    it('should overwrite previous values', () => {
      component.name = 'First';
      component.update();
      expect(checkoutService.getShipping().name).toBe('First');

      component.name = 'Second';
      component.update();
      expect(checkoutService.getShipping().name).toBe('Second');
    });

    it('should preserve addressLine2 when not set in component', () => {
      component.name = 'Test';
      component.addressLine2 = 'Apt 101';
      component.update();

      const shipping = checkoutService.getShipping();
      expect(shipping.name).toBe('Test');
      expect(shipping.addressLine2).toBe('Apt 101');
    });
  });
});
