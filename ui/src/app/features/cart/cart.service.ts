import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable } from 'rxjs';
import { CartItem } from './cart-item';
import { Product } from '../products/product';
import { OrderService, OrderRequest, OrderResponse } from '../orders/order.service';

const CART_STORAGE_KEY = 'angular-shop-cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly orderService = inject(OrderService);

  private cartItems = signal<CartItem[]>([]);

  cartItems$ = this.cartItems.asReadonly();
  cartItemCount = computed(() => this.cartItems().reduce((sum, item) => sum + item.quantity, 0));
  selectedItemCount = computed(() =>
    this.cartItems()
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.quantity, 0)
  );

  constructor() {
    this.restoreFromStorage();
  }

  private persist(): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cartItems()));
    } catch {
      // Silently fail if localStorage is unavailable (e.g., private browsing)
    }
  }

  restoreFromStorage(): void {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        this.cartItems.set(JSON.parse(stored));
      }
    } catch {
      // Silently fail if localStorage is unavailable or data is corrupted
    }
  }

  addToCart(product: Product, quantity = 1) {
    const current = this.cartItems();
    const existingItem = current.find(item => item.product.id === product.id);

    if (existingItem) {
      this.cartItems.update(items =>
        items.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      );
    } else {
      this.cartItems.update(items => [...items, { product, quantity, selected: true }]);
    }

    this.persist();
  }

  removeFromCart(productId: number) {
    this.cartItems.update(items => items.filter(item => item.product.id !== productId));
    this.persist();
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    this.cartItems.update(items =>
      items.map(item => (item.product.id === productId ? { ...item, quantity } : item))
    );
    this.persist();
  }

  toggleItemSelection(productId: number) {
    this.cartItems.update(items =>
      items.map(item =>
        item.product.id === productId ? { ...item, selected: !item.selected } : item
      )
    );
    this.persist();
  }

  selectAllItems(selected: boolean) {
    this.cartItems.update(items => items.map(item => ({ ...item, selected })));
    this.persist();
  }

  clearCart() {
    this.cartItems.set([]);
    this.persist();
  }

  getSubtotal(): number {
    return this.cartItems()
      .filter(item => item.selected)
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  getSelectedItems(): CartItem[] {
    return this.cartItems().filter(item => item.selected);
  }

  getAllItems(): CartItem[] {
    return this.cartItems();
  }

  placeOrder(shipping: number): Observable<OrderResponse> {
    const selected = this.getSelectedItems();
    const request: OrderRequest = {
      items: selected.map(item => ({
        productId: item.product.id,
        productName: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
      })),
      shipping,
    };

    return this.orderService.createOrder(request);
  }
}
