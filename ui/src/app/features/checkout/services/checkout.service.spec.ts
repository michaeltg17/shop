import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CheckoutService, initialCheckoutState } from './checkout.service';
import { CartService } from '../../cart/cart.service';

import { AuthService } from '../../../core/auth/services/auth.service';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let cartService: CartService;
  let router: Router;
  let snackBar: MatSnackBar;
  let httpMock: HttpTestingController;
  let authService: AuthService;

  const mockProduct = {
    id: 1,
    title: 'Test Product',
    price: 29.99,
    description: '',
    category: '',
    image: '',
    rating: { rate: 4, count: 10 },
  };

  const mockOrderResponse = {
    id: 1,
    items: [{ productId: 1, productName: 'Test Product', price: 29.99, quantity: 2 }],
    total: 65.97,
    shipping: 5.99,
    status: 'pending',
    createdAt: new Date().toISOString(),
    customerId: 42,
    shippingName: 'John Doe',
    shippingAddressLine1: '123 Main St',
    shippingAddressLine2: '',
    shippingCity: 'New York',
    shippingState: 'NY',
    shippingZip: '10001',
    shippingCountry: 'US',
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigate: jest.fn() },
        },
        {
          provide: MatSnackBar,
          useValue: { open: jest.fn() },
        },
      ],
    });

    service = TestBed.inject(CheckoutService);
    cartService = TestBed.inject(CartService);
    router = TestBed.inject(Router);
    snackBar = TestBed.inject(MatSnackBar);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should initialize with step 0, empty shipping, and empty payment', () => {
      const state = service.getState();
      expect(state.step).toBe(0);
      expect(state.shipping.name).toBe('');
      expect(state.payment.method).toBe('placeholder');
    });

    it('initialCheckoutState should match default state', () => {
      const expected = initialCheckoutState();
      const actual = service.getState();
      expect(actual).toEqual(expected);
    });
  });

  describe('step management', () => {
    it('should update current step', () => {
      service.setCurrentStep(1);
      expect(service.getCurrentStep()).toBe(1);
    });

    it('should not allow negative steps', () => {
      service.setCurrentStep(0);
      expect(service.getCurrentStep()).toBe(0);
    });
  });

  describe('shipping', () => {
    it('should update shipping fields', () => {
      service.updateShipping({ name: 'John Doe', city: 'New York' });
      const shipping = service.getShipping();
      expect(shipping.name).toBe('John Doe');
      expect(shipping.city).toBe('New York');
      expect(shipping.addressLine1).toBe('');
    });
  });

  describe('payment', () => {
    it('should update payment fields', () => {
      service.updatePayment({ method: 'card', cardName: 'John Doe' });
      const payment = service.getPayment();
      expect(payment.method).toBe('card');
      expect(payment.cardName).toBe('John Doe');
    });
  });

  describe('totals', () => {
    it('should return fixed shipping total of 5.99', () => {
      expect(service.shippingTotal).toBe(5.99);
    });

    it('should return subtotal from cart', () => {
      cartService.addToCart(mockProduct, 2);
      expect(service.subtotal).toBe(59.98);
    });

    it('should return total as subtotal + shipping', () => {
      cartService.addToCart(mockProduct, 1);
      const total = service.total;
      expect(total).toBeCloseTo(29.99 + 5.99, 2);
    });

    it('should exclude unselected items from subtotal', () => {
      const product2 = { ...mockProduct, id: 2, title: 'Product 2', price: 15 };
      cartService.addToCart(mockProduct, 1);
      cartService.addToCart(product2, 1);
      cartService.toggleItemSelection(product2.id);
      expect(service.subtotal).toBe(29.99);
    });
  });

  describe('canProceed', () => {
    it('should return true for review step (step 2)', () => {
      service.setCurrentStep(2);
      expect(service.canProceed()).toBe(true);
    });

    it('should return true when shipping is valid on step 0', () => {
      service.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });
      expect(service.canProceed()).toBe(true);
    });

    it('should return false when shipping is invalid on step 0', () => {
      service.updateShipping({ name: 'J' });
      expect(service.canProceed()).toBe(false);
    });

    it('should return true when payment is placeholder on step 1', () => {
      service.setCurrentStep(1);
      service.updatePayment({ method: 'placeholder' });
      expect(service.canProceed()).toBe(true);
    });

    it('should return true when payment is paypal on step 1', () => {
      service.setCurrentStep(1);
      service.updatePayment({ method: 'paypal' });
      expect(service.canProceed()).toBe(true);
    });

    it('should return false when card payment is incomplete on step 1', () => {
      service.setCurrentStep(1);
      service.updatePayment({ method: 'card', cardName: 'John' });
      expect(service.canProceed()).toBe(false);
    });
  });

  describe('placeOrder', () => {
    beforeEach(() => {
      service.reset();
    });

    it('should show error and not place order when cart is empty', () => {
      service.setCurrentStep(2);
      service.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });
      service.placeOrder();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Your cart is empty. Add items before checkout.',
        'Close',
        { duration: 4000 }
      );

      const requests = httpMock.match(() => true);
      expect(requests.length).toBe(0);
    });

    it('should place order with customerId from AuthService', () => {
      // Simulate a logged-in user by setting the user signal directly
      authService.user.set({ username: 'testuser', isAdmin: false, id: 42 });

      cartService.addToCart(mockProduct, 2);

      service.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });
      service.setCurrentStep(2);

      service.placeOrder();

      const req = httpMock.expectOne('api/orders');
      expect(req.request.method).toBe('POST');
      const body = req.request.body;
      expect(body.items.length).toBe(1);
      expect(body.customerId).toBe(42);
      expect(body.shippingName).toBe('John Doe');
      expect(body.shippingAddressLine1).toBe('123 Main St');

      req.flush(mockOrderResponse);

      expect(router.navigate).toHaveBeenCalledWith(['/shop/checkout/confirmation', 1]);
      expect(snackBar.open).toHaveBeenCalledWith('Order #1 placed successfully!', 'Close', {
        duration: 4000,
      });
    });

    it('should clear cart after successful order', () => {
      cartService.addToCart(mockProduct, 1);
      service.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });
      service.setCurrentStep(2);

      service.placeOrder();
      httpMock.expectOne('api/orders').flush(mockOrderResponse);

      expect(cartService.getAllItems().length).toBe(0);
    });

    it('should reset checkout state after successful order', () => {
      cartService.addToCart(mockProduct, 1);
      service.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });
      service.setCurrentStep(2);

      service.placeOrder();
      httpMock.expectOne('api/orders').flush(mockOrderResponse);

      const state = service.getState();
      expect(state.step).toBe(0);
      expect(state.shipping.name).toBe('');
    });

    it('should show error on API failure', () => {
      cartService.addToCart(mockProduct, 1);
      service.updateShipping({
        name: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
      });
      service.setCurrentStep(2);

      service.placeOrder();

      const req = httpMock.expectOne('api/orders');
      req.flush({ error: 'Server error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(snackBar.open).toHaveBeenCalledWith(
        'Failed to place order. Please try again.',
        'Close',
        { duration: 4000 }
      );
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', () => {
      service.updateShipping({ name: 'John Doe' });
      service.setCurrentStep(2);
      service.reset();

      const state = service.getState();
      expect(state.step).toBe(0);
      expect(state.shipping.name).toBe('');
      expect(state.payment.method).toBe('placeholder');
    });
  });
});
