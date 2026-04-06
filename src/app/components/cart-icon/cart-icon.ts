import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-icon',
  imports: [MatIconModule, MatButtonModule, RouterModule, CommonModule],
  templateUrl: './cart-icon.html',
  styleUrls: ['./cart-icon.scss']
})
export class CartIcon implements OnInit, OnDestroy {
  cartItemCount: number = 0;

  ngOnInit(): void {
    this.loadCartCount();
    // Listen for storage changes to update cart count
    window.addEventListener('storage', this.loadCartCount.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.loadCartCount.bind(this));
  }

  loadCartCount(): void {
    try {
      const cartData = localStorage.getItem('shoppingCart');
      if (cartData) {
        const cartItems = JSON.parse(cartData);
        this.cartItemCount = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
      } else {
        this.cartItemCount = 0;
      }
    } catch (error) {
      this.cartItemCount = 0;
    }
  }
}