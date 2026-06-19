import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartPage } from './cart-page';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../cart.service';
import { CartItem } from '../../../cart-item';
import { Product } from '../../../products/product';
import { signal } from '@angular/core';

describe('CartPage', () => {
  let component: CartPage;
  let fixture: ComponentFixture<CartPage>;
  let router: Partial<Router>;
  let cartService: Partial<CartService>;
  let itemsSignal: ReturnType<typeof signal<CartItem[]>>;

  const mockProduct: Product = {
    id: 1,
    title: 'Test Product',
    description: 'Test Description',
    price: 100,
    category: 'Test Category',
    image: 'https://example.com/image.jpg',
    rating: {
      rate: 4.5,
      count: 100,
    },
  };

  beforeEach(async () => {
    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
    };

    itemsSignal = signal<CartItem[]>([]);

    cartService = {
      cartItems$: itemsSignal.asReadonly(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      getSubtotal: jest.fn(() => 0),
    };

    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} }, paramMap: {} } },
        { provide: CartService, useValue: cartService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have shipping of 5.99', () => {
    expect(component.shipping).toBe(5.99);
  });

  it('should get cart items from CartService', () => {
    expect(component.cartItems).toEqual([]);
  });

  it('should reflect CartService items changes', () => {
    itemsSignal.set([{ product: mockProduct, quantity: 2 }]);
    expect(component.cartItems.length).toBe(1);
  });

  it('should get subtotal from CartService', () => {
    expect(component.subtotal).toBe(0);
  });

  it('should calculate total as subtotal + shipping', () => {
    expect(component.total).toBe(5.99);
  });

  it('should calculate total with non-zero subtotal', () => {
    (cartService.getSubtotal as jest.Mock).mockReturnValue(250);
    expect(component.total).toBe(255.99);
  });

  it('should update quantity via CartService', () => {
    const item: CartItem = { product: mockProduct, quantity: 1 };
    component.updateQuantity(item, 3);
    expect(cartService.updateQuantity).toHaveBeenCalledWith(mockProduct.id, 3);
  });

  it('should remove item when quantity is 0 or less', () => {
    const item: CartItem = { product: mockProduct, quantity: 1 };
    component.updateQuantity(item, 0);
    expect(cartService.removeFromCart).toHaveBeenCalledWith(mockProduct.id);
  });

  it('should remove item via CartService', () => {
    const item: CartItem = { product: mockProduct, quantity: 1 };
    component.removeItem(item);
    expect(cartService.removeFromCart).toHaveBeenCalledWith(mockProduct.id);
  });

  it('should checkout when cart has items', () => {
    itemsSignal.set([{ product: mockProduct, quantity: 2 }]);
    component.checkout();
    expect(cartService.clearCart).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/shop/products']);
  });

  it('should not checkout when cart is empty', () => {
    component.checkout();
    expect(cartService.clearCart).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
