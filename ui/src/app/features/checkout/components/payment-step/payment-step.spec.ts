import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PaymentStep } from './payment-step';
import { CheckoutService } from '../../services/checkout.service';

describe('PaymentStep', () => {
  let component: PaymentStep;
  let fixture: ComponentFixture<PaymentStep>;
  let checkoutService: CheckoutService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [PaymentStep, FormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentStep);
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
    it('should load payment data from checkoutService', () => {
      checkoutService.updatePayment({
        method: 'card',
        cardName: 'Jane Doe',
        cardNumber: '4242 4242 4242 4242',
        expiry: '12/28',
        cvv: '999',
      });

      fixture.detectChanges();

      expect(component.method).toBe('card');
      expect(component.cardName).toBe('Jane Doe');
      expect(component.cardNumber).toBe('4242 4242 4242 4242');
      expect(component.expiry).toBe('12/28');
      expect(component.cvv).toBe('999');
    });

    it('should default to placeholder payment', () => {
      fixture.detectChanges();
      expect(component.method).toBe('placeholder');
    });
  });

  describe('update()', () => {
    it('should push changes to checkoutService', () => {
      component.method = 'card';
      component.cardName = 'Test User';
      component.cardNumber = '1234567890123456';
      component.expiry = '01/30';
      component.cvv = '456';

      component.update();

      const payment = checkoutService.getPayment();
      expect(payment.method).toBe('card');
      expect(payment.cardName).toBe('Test User');
      expect(payment.cardNumber).toBe('1234567890123456');
      expect(payment.expiry).toBe('01/30');
      expect(payment.cvv).toBe('456');
    });
  });

  describe('formatCardNumber()', () => {
    it('should format digits into groups of 4', () => {
      component.formatCardNumber('4242424242424242');
      expect(component.cardNumber).toBe('4242 4242 4242 4242');
    });

    it('should strip non-digit characters', () => {
      component.formatCardNumber('4242-4242-4242-4242');
      expect(component.cardNumber).toBe('4242 4242 4242 4242');
    });

    it('should limit to 16 digits', () => {
      component.formatCardNumber('12345678901234561234');
      expect(component.cardNumber).toBe('1234 5678 9012 3456');
    });

    it('should handle partial input', () => {
      component.formatCardNumber('123');
      expect(component.cardNumber).toBe('123');
    });

    it('should call update after formatting', () => {
      component.formatCardNumber('4242424242424242');
      const payment = checkoutService.getPayment();
      expect(payment.cardNumber).toBe('4242 4242 4242 4242');
    });
  });

  describe('formatExpiry()', () => {
    it('should format MMYY into MM/YY', () => {
      component.formatExpiry('1225');
      expect(component.expiry).toBe('12/25');
    });

    it('should handle 2 digits (month only)', () => {
      component.formatExpiry('12');
      expect(component.expiry).toBe('12');
    });

    it('should handle 3 digits', () => {
      component.formatExpiry('122');
      expect(component.expiry).toBe('12/2');
    });

    it('should limit to 4 digits', () => {
      component.formatExpiry('12259');
      expect(component.expiry).toBe('12/25');
    });

    it('should strip non-digit characters', () => {
      component.formatExpiry('12/25');
      expect(component.expiry).toBe('12/25');
    });

    it('should call update after formatting', () => {
      component.formatExpiry('0630');
      const payment = checkoutService.getPayment();
      expect(payment.expiry).toBe('06/30');
    });
  });
});
