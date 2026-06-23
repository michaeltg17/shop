import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrdersPage } from './orders-page';
import { OrderResponse } from '../../order.service';

describe('OrdersPage', () => {
  let component: OrdersPage;
  let fixture: ComponentFixture<OrdersPage>;
  let httpMock: HttpTestingController;

  const mockOrders: OrderResponse[] = [
    {
      id: 1,
      items: [{ productId: 1, productName: 'Test Product', price: 29.99, quantity: 2 }],
      total: 64.98,
      shipping: 5,
      status: 'pending',
      createdAt: '2026-06-20T10:00:00Z',
    },
    {
      id: 2,
      items: [
        { productId: 2, productName: 'Another Product', price: 15, quantity: 1 },
        { productId: 3, productName: 'Third Product', price: 40, quantity: 3 },
      ],
      total: 145,
      shipping: 8,
      status: 'completed',
      createdAt: '2026-06-18T14:30:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersPage);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load orders on init', () => {
    fixture.ngOnInit();

    const req = httpMock.expectOne('api/orders');
    expect(req.request.method).toBe('GET');
    req.flush(mockOrders);

    fixture.detectChanges();
    expect(component.orders().length).toBe(2);
    expect(component.loading()).toBeFalse();
  });

  it('should set error state on load failure', () => {
    fixture.ngOnInit();

    const req = httpMock.expectOne('api/orders');
    req.flush({ error: 'Not found' }, { status: 500, statusText: 'Internal Server Error' });

    fixture.detectChanges();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBeFalse();
  });

  it('should display empty state when no orders', fakeAsync(() => {
    fixture.ngOnInit();
    const req = httpMock.expectOne('api/orders');
    req.flush([]);
    fixture.detectChanges();

    const nativeEl = fixture.nativeElement;
    expect(nativeEl.querySelector('.empty-state')).toBeTruthy();
  }));

  it('should format currency correctly', () => {
    expect(component.formatCurrency(10)).toBe('$10.00');
    expect(component.formatCurrency(99.9)).toBe('$99.90');
    expect(component.formatCurrency(0)).toBe('$0.00');
  });

  it('should format date correctly', () => {
    const result = component.formatDate('2026-06-20T10:00:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should return correct status colors', () => {
    expect(component.getStatusColor('pending')).toBe('#ff9800');
    expect(component.getStatusColor('processing')).toBe('#2196f3');
    expect(component.getStatusColor('completed')).toBe('#4caf50');
    expect(component.getStatusColor('cancelled')).toBe('#f44336');
    expect(component.getStatusColor('unknown')).toBe('#9e9e9e');
  });
});
