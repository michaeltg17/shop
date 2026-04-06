import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '../../models/product';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.html',
  styleUrls: ['./cart-page.css']
})
export class CartPage implements OnInit, OnDestroy {
  cartItems: CartItem[] = [];
  subtotal: number = 0;
  shipping: number = 5.99;
  total: number = 0;

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  ngOnDestroy(): void {
    this.saveCart();
  }

  loadCart(): void {
    const cartData = localStorage.getItem('shoppingCart');
    if (cartData) {
      this.cartItems = JSON.parse(cartData);
      this.calculateTotals();
    }
  }

  saveCart(): void {
    localStorage.setItem('shoppingCart', JSON.stringify(this.cartItems));
    this.calculateTotals();
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }

    item.quantity = newQuantity;
    this.saveCart();
  }

  removeItem(item: CartItem): void {
    this.cartItems = this.cartItems.filter(cartItem => cartItem !== item);
    this.saveCart();
  }

  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    this.total = this.subtotal + this.shipping;
  }

  checkout(): void {
    if (this.cartItems.length === 0) {
      return;
    }

    // In a real application, this would navigate to a checkout page
    // For now, we'll just show an alert
    alert('Checkout functionality would be implemented here!');
    this.cartItems = [];
    this.saveCart();
    this.router.navigate(['/products']);
  }
}