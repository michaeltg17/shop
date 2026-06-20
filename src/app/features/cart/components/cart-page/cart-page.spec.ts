import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartPage } from './cart-page';
import { Router, ActivatedRoute } from '@angular/router';
import { CartService } from '../../cart.service';
import { CartItem } from '../../cart-item';
import { Product } from '../../../products/product';
import { signal } from '@angular/core';

describe('CartPage', () => {
  let component: CartPage;
  let fixture: ComponentFixture<CartPage>;
  let router: Partial<Router>;
  let cartService: CartService;
  let itemsSignal: ReturnType<typeof signal<CartItem[]>>;

  const mockProduct: Product = {
    id: 1,
    title: 'Test Product',
    description: 'Test Description',
    price: 100,
    category: 'Test Category',
    image: 'https://example.com/image.jpg',
    rating: { rate: 4.5, count: 100 },
  };

  const mockSnackBar = { open: jest.fn() };

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
      getSelectedItems: jest.fn(() => []),
      toggleItemSelection: jest.fn(),
      selectAllItems: jest.fn(),
      selectedItemCount: signal(0),
    } as Partial<CartService> as CartService;

    await TestBed.configureTestingModule({
      imports: [CartPage],
      providers: [
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} }, paramMap: {} } },
        { provide: CartService, useValue: cartService },
        { provide: import('@angular/material/snack-bar').MatSnackBar, useValue: mockSnackBar },
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
    expect(component.cartItems()).toEqual([]);
  });

  it('should get subtotal from CartService', () => {
    expect(component.subtotal).toBe(0);
  });

  it('should calculate total as subtotal + shipping', () => {
    expect(component.total).toBe(5.99);
  });

  it('should calculate total with non-zero subtotal', () => {
    (cartService.getSubtotal as jest.Mock).mockReturnValue(250);
    fixture.detectChanges();
    expect(component.total).toBe(255.99);
  });

  it('should toggle item selection via CartService', () => {
    const item: CartItem = { product: mockProduct, quantity: 1, selected: false };
    component.toggleItemSelection(item);
    expect(cartService.toggleItemSelection).toHaveBeenCalledWith(mockProduct.id);
  });

  it('should toggle all items', () => {
    component.toggleAll();
    expect(cartService.selectAllItems).toHaveBeenCalledWith(true);
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

  it('should checkout when cart has selected items', () => {
    (cartService.getSelectedItems as jest.Mock).mockReturnValue([
      { product: mockProduct, quantity: 2, selected: true },
    ]);
    fixture.detectChanges();
    component.checkout();
    expect(cartService.clearCart).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/shop/products']);
  });

  it('should not checkout when no items are selected', () => {
    (cartService.getSelectedItems as jest.Mock).mockReturnValue([]);
    fixture.detectChanges();
    component.checkout();
    expect(cartService.clearCart).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should get selected items from CartService', () => {
    const selected: CartItem[] = [{ product: mockProduct, quantity: 1, selected: true }];
    (cartService.getSelectedItems as jest.Mock).mockReturnValue(selected);
    fixture.detectChanges();
    expect(component.selectedItems).toEqual(selected);
  });

  it('should reflect CartService items changes', () => {
    itemsSignal.set([{ product: mockProduct, quantity: 2 }]);
    fixture.detectChanges();
    expect(component.cartItems().length).toBe(1);
  });

  it('should toggleAll deselect when all are selected', () => {
    component.allSelected.set(true);
    component.toggleAll();
    expect(cartService.selectAllItems).toHaveBeenCalledWith(false);
  });

  it('should updateQuantity with negative number removes item', () => {
    const item: CartItem = { product: mockProduct, quantity: 1 };
    component.updateQuantity(item, -1);
    expect(cartService.removeFromCart).toHaveBeenCalledWith(mockProduct.id);
    expect(cartService.updateQuantity).not.toHaveBeenCalled();
  });

  it('should show snackbar when removing item', () => {
    const item: CartItem = { product: mockProduct, quantity: 1 };
    component.removeItem(item);
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      `Removed ${mockProduct.title} from cart`,
      'Close',
      { duration: 2000 }
    );
  });

  it('should show snackbar when no items selected for checkout', () => {
    component.checkout();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Select at least one item to checkout',
      'Close',
      { duration: 3000 }
    );
  });

  it('should show success snackbar on checkout', () => {
    (cartService.getSelectedItems as jest.Mock).mockReturnValue([
      { product: mockProduct, quantity: 1, selected: true },
    ]);
    fixture.detectChanges();
    component.checkout();
    expect(mockSnackBar.open).toHaveBeenCalledWith('Order placed successfully!', 'Close', {
      duration: 3000,
    });
  });

  it('should set allSelected to false when effect runs with items not all selected', () => {
    itemsSignal.set([{ product: mockProduct, quantity: 1, selected: false }]);
    fixture.detectChanges();
    expect(component.allSelected()).toBe(false);
  });

  it('should set allSelected to true when effect runs with all items selected', () => {
    itemsSignal.set([{ product: mockProduct, quantity: 1, selected: true }]);
    fixture.detectChanges();
    expect(component.allSelected()).toBe(true);
  });

  it('should set allSelected to false when cart is empty', () => {
    itemsSignal.set([]);
    fixture.detectChanges();
    expect(component.allSelected()).toBe(false);
  });

  it('should handle subtotal with multiple items', () => {
    (cartService.getSubtotal as jest.Mock).mockReturnValue(500);
    expect(component.total).toBe(505.99);
  });
});
