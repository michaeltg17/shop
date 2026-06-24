import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router, ActivatedRoute } from '@angular/router';
import { ConfirmationPage } from './confirmation-page';
import { OrderResponse } from '../../../orders/order.service';

describe('ConfirmationPage', () => {
  let component: ConfirmationPage;
  let fixture: ComponentFixture<ConfirmationPage>;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockOrder: OrderResponse = {
    id: 42,
    items: [{ productId: 1, productName: 'Widget', price: 29.99, quantity: 2 }],
    total: 65.97,
    shipping: 5.99,
    status: 'pending',
    createdAt: '2026-06-24T10:30:00Z',
    customerId: 1,
    shippingName: 'John Doe',
    shippingAddressLine1: '123 Main St',
    shippingAddressLine2: 'Apt 4',
    shippingCity: 'New York',
    shippingState: 'NY',
    shippingZip: '10001',
    shippingCountry: 'US',
  };

  beforeEach(async () => {
    localStorage.clear();

    const mockActivatedRoute = {
      snapshot: {
        params: { id: '42' },
      },
    };

    await TestBed.configureTestingModule({
      imports: [ConfirmationPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start loading', () => {
    expect(component.loading).toBe(true);
  });

  it('should parse orderId from route params after init', () => {
    fixture.detectChanges();
    // orderId is set in ngOnInit, so we need to detect changes first
    expect(component.orderId).toBe(42);
    // Flush the HTTP request to avoid verify() errors
    httpMock.expectOne('api/orders/42').flush({});
  });

  describe('ngOnInit', () => {
    it('should fetch order and set it on success', () => {
      fixture.detectChanges();

      const req = httpMock.expectOne(`api/orders/42`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOrder);

      expect(component.loading).toBe(false);
      expect(component.order).toEqual(mockOrder);
      expect(component.error).toBe(false);
    });

    it('should set error flag on API failure', () => {
      fixture.detectChanges();

      const req = httpMock.expectOne(`api/orders/42`);
      req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(component.loading).toBe(false);
      expect(component.error).toBe(true);
      expect(component.order).toBeNull();
    });
  });

  describe('formattedDate', () => {
    it('should format createdAt to locale string', () => {
      component.order = mockOrder;
      expect(component.formattedDate).toBeTruthy();
      expect(typeof component.formattedDate).toBe('string');
    });

    it('should return empty string when order has no createdAt', () => {
      component.order = { ...mockOrder, createdAt: '' } as OrderResponse;
      expect(component.formattedDate).toBe('');
    });

    it('should return empty string when order is null', () => {
      component.order = null;
      expect(component.formattedDate).toBe('');
    });
  });

  describe('continueShopping', () => {
    it('should navigate to products page', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.continueShopping();
      expect(navigateSpy).toHaveBeenCalledWith(['/shop/products']);
    });
  });

  describe('viewOrders', () => {
    it('should navigate to orders page', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      component.viewOrders();
      expect(navigateSpy).toHaveBeenCalledWith(['/shop/orders']);
    });
  });
});
