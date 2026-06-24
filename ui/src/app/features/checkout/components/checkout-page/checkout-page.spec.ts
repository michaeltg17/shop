import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CheckoutPage } from './checkout-page';
import { CheckoutService } from '../../services/checkout.service';

describe('CheckoutPage', () => {
  let component: CheckoutPage;
  let fixture: ComponentFixture<CheckoutPage>;
  let checkoutService: CheckoutService;
  let snackBarSpy: jest.SpyInstance;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutPage);
    component = fixture.componentInstance;
    checkoutService = TestBed.inject(CheckoutService);

    snackBarSpy = jest.spyOn(component['snackBar'], 'open');

    checkoutService.reset();
  });

  afterEach(() => {
    snackBarSpy.mockRestore();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 step labels', () => {
    expect(component.stepLabels.length).toBe(3);
    expect(component.stepLabels).toEqual(['Shipping', 'Payment', 'Review']);
  });

  it('should start at step 0', () => {
    expect(component.currentStep()).toBe(0);
  });

  it('should reflect step changes from checkoutService', () => {
    checkoutService.setCurrentStep(1);
    expect(component.currentStep()).toBe(1);
  });

  describe('next()', () => {
    it('should advance from step 0 to step 1 with valid shipping', () => {
      checkoutService.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });

      component.next();
      expect(checkoutService.getCurrentStep()).toBe(1);
    });

    it('should show snackbar when any shipping field is empty at step 0', () => {
      // Default state has all fields empty
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Please fill in all required shipping fields',
        'Close',
        { duration: 3000 }
      );
      expect(checkoutService.getCurrentStep()).toBe(0);
    });

    it('should show snackbar when shipping name is blank', () => {
      checkoutService.updateShipping({ name: '   ' });
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Please fill in all required shipping fields',
        'Close',
        { duration: 3000 }
      );
    });

    it('should show snackbar when shipping addressLine1 is blank', () => {
      checkoutService.updateShipping({
        name: 'John Doe',
        addressLine1: '  ',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Please fill in all required shipping fields',
        'Close',
        { duration: 3000 }
      );
    });

    it('should show snackbar when shipping city is blank', () => {
      checkoutService.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: '  ',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Please fill in all required shipping fields',
        'Close',
        { duration: 3000 }
      );
    });

    it('should show snackbar when shipping state is blank', () => {
      checkoutService.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: '  ',
        zip: '10001',
        country: 'US',
      });
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Please fill in all required shipping fields',
        'Close',
        { duration: 3000 }
      );
    });

    it('should show snackbar when shipping zip is blank', () => {
      checkoutService.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '  ',
        country: 'US',
      });
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Please fill in all required shipping fields',
        'Close',
        { duration: 3000 }
      );
    });

    it('should show snackbar when shipping country is blank', () => {
      checkoutService.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: '  ',
      });
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Please fill in all required shipping fields',
        'Close',
        { duration: 3000 }
      );
    });

    it('should advance from step 1 to step 2 with valid card payment', () => {
      checkoutService.setCurrentStep(1);
      checkoutService.updatePayment({
        method: 'card',
        cardName: 'John Doe',
        cardNumber: '4242 4242 4242 4242',
        cvv: '123',
      });

      component.next();
      expect(checkoutService.getCurrentStep()).toBe(2);
    });

    it('should show snackbar when card name is empty at step 1', () => {
      checkoutService.setCurrentStep(1);
      checkoutService.updatePayment({
        method: 'card',
        cardName: '',
        cardNumber: '4242 4242 4242 4242',
        cvv: '123',
      });
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith('Please fill in all payment fields', 'Close', {
        duration: 3000,
      });
      expect(checkoutService.getCurrentStep()).toBe(1);
    });

    it('should show snackbar when card number is not 16 digits at step 1', () => {
      checkoutService.setCurrentStep(1);
      checkoutService.updatePayment({
        method: 'card',
        cardName: 'John Doe',
        cardNumber: '123',
        cvv: '123',
      });
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith('Please fill in all payment fields', 'Close', {
        duration: 3000,
      });
    });

    it('should show snackbar when cvv is missing at step 1', () => {
      checkoutService.setCurrentStep(1);
      checkoutService.updatePayment({
        method: 'card',
        cardName: 'John Doe',
        cardNumber: '4242 4242 4242 4242',
        cvv: '',
      });
      component.next();

      expect(snackBarSpy).toHaveBeenCalledWith('Please fill in all payment fields', 'Close', {
        duration: 3000,
      });
    });

    it('should allow card number with spaces at step 1', () => {
      checkoutService.setCurrentStep(1);
      checkoutService.updatePayment({
        method: 'card',
        cardName: 'John Doe',
        cardNumber: '4242 4242 4242 4242',
        cvv: '123',
      });

      component.next();
      expect(checkoutService.getCurrentStep()).toBe(2);
    });

    it('should skip payment validation for non-card methods at step 1', () => {
      checkoutService.setCurrentStep(1);
      checkoutService.updatePayment({ method: 'paypal' });

      component.next();
      expect(checkoutService.getCurrentStep()).toBe(2);
    });

    it('should skip payment validation for placeholder at step 1', () => {
      checkoutService.setCurrentStep(1);
      checkoutService.updatePayment({ method: 'placeholder' });

      component.next();
      expect(checkoutService.getCurrentStep()).toBe(2);
    });
  });

  describe('back()', () => {
    it('should go back from step 1 to step 0', () => {
      checkoutService.setCurrentStep(1);
      component.back();
      expect(checkoutService.getCurrentStep()).toBe(0);
    });

    it('should go back from step 2 to step 1', () => {
      checkoutService.setCurrentStep(2);
      component.back();
      expect(checkoutService.getCurrentStep()).toBe(1);
    });

    it('should not go below step 0', () => {
      checkoutService.setCurrentStep(0);
      component.back();
      expect(checkoutService.getCurrentStep()).toBe(0);
    });
  });

  describe('placeOrder()', () => {
    let httpMock: HttpTestingController;

    beforeEach(() => {
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should delegate placeOrder to checkoutService', () => {
      jest.spyOn(checkoutService, 'placeOrder');
      component.placeOrder();
      expect(checkoutService.placeOrder).toHaveBeenCalled();
    });
  });
});
