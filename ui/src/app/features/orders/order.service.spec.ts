import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService, OrderRequest, OrderResponse, OrderItem } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  const mockOrderItem: OrderItem = {
    productId: 1,
    productName: 'Test Product',
    price: 10,
    quantity: 2,
  };

  const mockOrderRequest: OrderRequest = {
    items: [mockOrderItem],
    shipping: 5,
  };

  const mockOrderResponse: OrderResponse = {
    id: 1,
    items: [mockOrderItem],
    total: 25,
    shipping: 5,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getOrders', () => {
    it('should GET from api/orders and return an array of orders', () => {
      service.getOrders().subscribe(response => {
        expect(response).toEqual([mockOrderResponse]);
        expect(response.length).toBe(1);
      });

      const req = httpMock.expectOne('api/orders');
      expect(req.request.method).toBe('GET');
      req.flush([mockOrderResponse]);
    });

    it('should return an empty array when no orders exist', () => {
      service.getOrders().subscribe(response => {
        expect(response).toEqual([]);
      });

      const req = httpMock.expectOne('api/orders');
      req.flush([]);
    });

    it('should handle server error', () => {
      service.getOrders().subscribe({
        next: () => fail('should have errored'),
        error: err => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne('api/orders');
      req.flush(
        { error: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('getOrder', () => {
    it('should GET from api/orders/{id} and return a single order', () => {
      service.getOrder(1).subscribe(response => {
        expect(response).toEqual(mockOrderResponse);
        expect(response.id).toBe(1);
      });

      const req = httpMock.expectOne('api/orders/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockOrderResponse);
    });

    it('should handle not found error', () => {
      service.getOrder(999).subscribe({
        next: () => fail('should have errored'),
        error: err => {
          expect(err.status).toBe(404);
        },
      });

      const req = httpMock.expectOne('api/orders/999');
      req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createOrder', () => {
    it('should POST to api/orders and return the created order', () => {
      service.createOrder(mockOrderRequest).subscribe(response => {
        expect(response).toEqual(mockOrderResponse);
        expect(response.id).toBe(1);
        expect(response.status).toBe('pending');
      });

      const req = httpMock.expectOne('api/orders');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockOrderRequest);
      req.flush(mockOrderResponse);
    });

    it('should send correct order items in request body', () => {
      service.createOrder(mockOrderRequest).subscribe(() => undefined);

      const req = httpMock.expectOne('api/orders');
      expect(req.request.body.items.length).toBe(1);
      expect(req.request.body.items[0].productId).toBe(1);
      expect(req.request.body.items[0].productName).toBe('Test Product');
      expect(req.request.body.items[0].price).toBe(10);
      expect(req.request.body.items[0].quantity).toBe(2);
    });

    it('should handle server error', () => {
      service.createOrder(mockOrderRequest).subscribe({
        next: () => fail('should have errored'),
        error: err => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne('api/orders');
      req.flush(
        { error: 'Internal server error' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });

    it('should handle multiple items in order', () => {
      const multiItemRequest: OrderRequest = {
        items: [
          { productId: 1, productName: 'Product 1', price: 10, quantity: 1 },
          { productId: 2, productName: 'Product 2', price: 20, quantity: 3 },
        ],
        shipping: 10,
      };

      const response: OrderResponse = {
        id: 2,
        items: multiItemRequest.items,
        total: 80,
        shipping: 10,
        status: 'processing',
        createdAt: new Date().toISOString(),
      };

      service.createOrder(multiItemRequest).subscribe(result => {
        expect(result.items.length).toBe(2);
      });

      const req = httpMock.expectOne('api/orders');
      expect(req.request.body.items.length).toBe(2);
      req.flush(response);
    });
  });
});
