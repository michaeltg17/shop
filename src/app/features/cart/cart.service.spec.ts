import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { Product } from '../products/product';

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: 'A test product',
  price: 10,
  category: 'test',
  image: 'test.jpg',
  rating: { rate: 4, count: 10 },
};

const mockProduct2: Product = {
  id: 2,
  title: 'Another Product',
  description: 'Another test product',
  price: 20,
  category: 'test',
  image: 'test2.jpg',
  rating: { rate: 5, count: 20 },
};

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.clearCart();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addToCart', () => {
    it('should add a new product to the cart with selected=true', () => {
      service.addToCart(mockProduct);
      const items = service.cartItems$();
      expect(items.length).toBe(1);
      expect(items[0].product).toBe(mockProduct);
      expect(items[0].quantity).toBe(1);
      expect(items[0].selected).toBe(true);
    });

    it('should add a product with a specified quantity', () => {
      service.addToCart(mockProduct, 3);
      const items = service.cartItems$();
      expect(items[0].quantity).toBe(3);
    });

    it('should increase quantity when adding an existing product', () => {
      service.addToCart(mockProduct, 2);
      service.addToCart(mockProduct, 3);
      const items = service.cartItems$();
      expect(items.length).toBe(1);
      expect(items[0].quantity).toBe(5);
    });

    it('should handle adding different products', () => {
      service.addToCart(mockProduct);
      service.addToCart(mockProduct2);
      const items = service.cartItems$();
      expect(items.length).toBe(2);
    });
  });

  describe('removeFromCart', () => {
    it('should remove a product from the cart', () => {
      service.addToCart(mockProduct);
      service.removeFromCart(mockProduct.id);
      expect(service.cartItems$().length).toBe(0);
    });

    it('should not affect other products', () => {
      service.addToCart(mockProduct);
      service.addToCart(mockProduct2);
      service.removeFromCart(mockProduct.id);
      const items = service.cartItems$();
      expect(items.length).toBe(1);
      expect(items[0].product.id).toBe(mockProduct2.id);
    });
  });

  describe('updateQuantity', () => {
    it('should update the quantity of a product', () => {
      service.addToCart(mockProduct, 1);
      service.updateQuantity(mockProduct.id, 5);
      const items = service.cartItems$();
      expect(items[0].quantity).toBe(5);
    });

    it('should remove the product when quantity is set to 0', () => {
      service.addToCart(mockProduct, 1);
      service.updateQuantity(mockProduct.id, 0);
      expect(service.cartItems$().length).toBe(0);
    });

    it('should remove the product when quantity is negative', () => {
      service.addToCart(mockProduct, 1);
      service.updateQuantity(mockProduct.id, -1);
      expect(service.cartItems$().length).toBe(0);
    });
  });

  describe('toggleItemSelection', () => {
    it('should toggle selected state of an item', () => {
      service.addToCart(mockProduct);
      expect(service.cartItems$()[0].selected).toBe(true);
      service.toggleItemSelection(mockProduct.id);
      expect(service.cartItems$()[0].selected).toBe(false);
      service.toggleItemSelection(mockProduct.id);
      expect(service.cartItems$()[0].selected).toBe(true);
    });

    it('should not affect other items', () => {
      service.addToCart(mockProduct);
      service.addToCart(mockProduct2);
      service.toggleItemSelection(mockProduct.id);
      expect(service.cartItems$()[0].selected).toBe(false);
      expect(service.cartItems$()[1].selected).toBe(true);
    });
  });

  describe('selectAllItems', () => {
    it('should select all items when passed true', () => {
      service.addToCart(mockProduct);
      service.addToCart(mockProduct2);
      service.toggleItemSelection(mockProduct.id);
      expect(service.cartItems$()[0].selected).toBe(false);
      service.selectAllItems(true);
      expect(service.cartItems$()[0].selected).toBe(true);
      expect(service.cartItems$()[1].selected).toBe(true);
    });

    it('should deselect all items when passed false', () => {
      service.addToCart(mockProduct);
      service.addToCart(mockProduct2);
      service.selectAllItems(false);
      expect(service.cartItems$()[0].selected).toBe(false);
      expect(service.cartItems$()[1].selected).toBe(false);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from the cart', () => {
      service.addToCart(mockProduct);
      service.addToCart(mockProduct2);
      service.clearCart();
      expect(service.cartItems$().length).toBe(0);
    });
  });

  describe('getSubtotal', () => {
    it('should return 0 for an empty cart', () => {
      expect(service.getSubtotal()).toBe(0);
    });

    it('should calculate subtotal only for selected items', () => {
      service.addToCart(mockProduct, 2); // 10 * 2 = 20, selected=true
      service.addToCart(mockProduct2, 1); // 20 * 1 = 20, selected=true
      expect(service.getSubtotal()).toBe(40);

      service.toggleItemSelection(mockProduct2.id);
      expect(service.getSubtotal()).toBe(20);
    });
  });

  describe('getSelectedItems', () => {
    it('should return only selected items', () => {
      service.addToCart(mockProduct);
      service.addToCart(mockProduct2);
      service.toggleItemSelection(mockProduct2.id);
      expect(service.getSelectedItems().length).toBe(1);
      expect(service.getSelectedItems()[0].product.id).toBe(mockProduct.id);
    });

    it('should return empty array when no items selected', () => {
      service.addToCart(mockProduct);
      service.selectAllItems(false);
      expect(service.getSelectedItems().length).toBe(0);
    });
  });

  describe('getAllItems', () => {
    it('should return all items regardless of selection', () => {
      service.addToCart(mockProduct);
      service.addToCart(mockProduct2);
      service.toggleItemSelection(mockProduct2.id);
      expect(service.getAllItems().length).toBe(2);
    });
  });

  describe('cartItemCount', () => {
    it('should return 0 for an empty cart', () => {
      expect(service.cartItemCount()).toBe(0);
    });

    it('should return the total count of items', () => {
      service.addToCart(mockProduct, 2);
      service.addToCart(mockProduct2, 3);
      expect(service.cartItemCount()).toBe(5);
    });
  });

  describe('selectedItemCount', () => {
    it('should return 0 for an empty cart', () => {
      expect(service.selectedItemCount()).toBe(0);
    });

    it('should return count of only selected items', () => {
      service.addToCart(mockProduct, 2);
      service.addToCart(mockProduct2, 3);
      expect(service.selectedItemCount()).toBe(5);

      service.toggleItemSelection(mockProduct2.id);
      expect(service.selectedItemCount()).toBe(2);
    });
  });
});
