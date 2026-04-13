import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartPage } from './cart-page';
import { Router, ActivatedRoute } from '@angular/router';
import { Product } from '../../../products/product';

describe('CartPage', () => {
  let component: CartPage;
  let fixture: ComponentFixture<CartPage>;
  let router: Partial<Router>;

  const mockProduct: Product = {
    id: 1,
    title: 'Test Product',
    description: 'Test Description',
    price: 10.99,
    category: 'Test Category',
    image: 'https://example.com/image.jpg',
    rating: { rate: 4.5, count: 10 },
  };

  beforeEach(async () => {
    localStorage.clear();
    router = {
      navigate: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty cart', () => {
    expect(component.cartItems).toEqual([]);
  });

  it('should load cart from localStorage', () => {
    localStorage.setItem('shoppingCart', JSON.stringify([{ product: mockProduct, quantity: 2 }]));
    component.loadCart();
    expect(component.cartItems.length).toBe(1);
  });

  it('should save cart to localStorage', () => {
    component.cartItems = [{ product: mockProduct, quantity: 1 }];
    component.saveCart();
    const saved = JSON.parse(localStorage.getItem('shoppingCart') || '[]');
    expect(saved.length).toBe(1);
  });

  it('should update item quantity', () => {
    component.cartItems = [{ product: mockProduct, quantity: 1 }];
    component.updateQuantity(component.cartItems[0], 3);
    expect(component.cartItems[0].quantity).toBe(3);
  });

  it('should remove item when quantity is 0 or less', () => {
    component.cartItems = [{ product: mockProduct, quantity: 1 }];
    component.updateQuantity(component.cartItems[0], 0);
    expect(component.cartItems.length).toBe(0);
  });

  it('should remove item', () => {
    component.cartItems = [{ product: mockProduct, quantity: 1 }];
    component.removeItem(component.cartItems[0]);
    expect(component.cartItems.length).toBe(0);
  });

  it('should calculate totals', () => {
    component.cartItems = [{ product: mockProduct, quantity: 2 }];
    component.calculateTotals();
    expect(component.subtotal).toBe(mockProduct.price * 2);
    expect(component.total).toBe(mockProduct.price * 2 + component.shipping);
  });

  it('should navigate to products on checkout', () => {
    component.cartItems = [{ product: mockProduct, quantity: 1 }];
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    component.checkout();
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
  });
});