import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ReviewStep } from './review-step';
import { CheckoutService } from '../../services/checkout.service';
import { CartService } from '../../../cart/cart.service';

describe('ReviewStep', () => {
  let component: ReviewStep;
  let fixture: ComponentFixture<ReviewStep>;
  let checkoutService: CheckoutService;
  let cartService: CartService;

  const mockProduct = {
    id: 1,
    title: 'Widget',
    price: 29.99,
    description: '',
    category: '',
    image: '',
    rating: { rate: 4, count: 10 },
  };

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [ReviewStep],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewStep);
    component = fixture.componentInstance;
    checkoutService = TestBed.inject(CheckoutService);
    cartService = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('shipping getter', () => {
    it('should return shipping from checkoutService', () => {
      checkoutService.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });

      const shipping = component.shipping;
      expect(shipping.name).toBe('John Doe');
      expect(shipping.city).toBe('New York');
    });
  });

  describe('payment getter', () => {
    it('should return payment from checkoutService', () => {
      checkoutService.updatePayment({
        method: 'card',
        cardName: 'John Doe',
        cardNumber: '4242424242424242',
      });

      expect(component.payment.method).toBe('card');
      expect(component.payment.cardName).toBe('John Doe');
    });
  });

  describe('selectedItems getter', () => {
    it('should return selected items from cart', () => {
      cartService.addToCart(mockProduct, 2);
      expect(component.selectedItems.length).toBe(1);
      expect(component.selectedItems[0].product.title).toBe('Widget');
      expect(component.selectedItems[0].quantity).toBe(2);
    });

    it('should return empty array when cart is empty', () => {
      expect(component.selectedItems.length).toBe(0);
    });

    it('should only return selected items', () => {
      const product2 = { ...mockProduct, id: 2, title: 'Gadget', price: 15 };
      cartService.addToCart(mockProduct, 1);
      cartService.addToCart(product2, 1);
      cartService.toggleItemSelection(product2.id);

      expect(component.selectedItems.length).toBe(1);
      expect(component.selectedItems[0].product.title).toBe('Widget');
    });
  });

  describe('subtotal getter', () => {
    it('should return subtotal from checkoutService', () => {
      cartService.addToCart(mockProduct, 2);
      expect(component.subtotal).toBe(59.98);
    });

    it('should be 0 when cart is empty', () => {
      expect(component.subtotal).toBe(0);
    });
  });

  describe('shippingCost getter', () => {
    it('should return fixed shipping cost', () => {
      expect(component.shippingCost).toBe(5.99);
    });
  });

  describe('total getter', () => {
    it('should return subtotal + shipping', () => {
      cartService.addToCart(mockProduct, 1);
      expect(component.total).toBeCloseTo(29.99 + 5.99, 2);
    });
  });

  describe('paymentMethodLabel', () => {
    it('should return card label for card payment', () => {
      checkoutService.updatePayment({
        method: 'card',
        cardNumber: '4242424242424242',
      });

      expect(component.paymentMethodLabel).toBe('Card ending in 4242');
    });

    it('should return PayPal for paypal payment', () => {
      checkoutService.updatePayment({ method: 'paypal' });
      expect(component.paymentMethodLabel).toBe('PayPal');
    });

    it('should return test mode label for placeholder payment', () => {
      checkoutService.updatePayment({ method: 'placeholder' });
      expect(component.paymentMethodLabel).toBe('Test Mode (No real payment)');
    });

    it('should handle short card numbers gracefully', () => {
      checkoutService.updatePayment({
        method: 'card',
        cardNumber: '4242',
      });

      // slice(-4) on a 4-char string returns the whole string
      expect(component.paymentMethodLabel).toBe('Card ending in 4242');
    });
  });
});
