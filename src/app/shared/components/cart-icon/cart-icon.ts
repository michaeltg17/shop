import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cart-icon',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, RouterModule, CommonModule],
  templateUrl: './cart-icon.html',
  styleUrls: ['./cart-icon.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartIcon implements OnInit, OnDestroy {
  cartItemCount = 0;

  private readonly storageListener = () => this.loadCartCount();

  ngOnInit(): void {
    this.loadCartCount();
    window.addEventListener('storage', this.storageListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('storage', this.storageListener);
  }

  loadCartCount(): void {
    try {
      const cartData = localStorage.getItem('shoppingCart');
      if (cartData) {
        const cartItems = JSON.parse(cartData);
        this.cartItemCount = cartItems.reduce(
          (total: number, item: { quantity: number }) => total + item.quantity,
          0
        );
      } else {
        this.cartItemCount = 0;
      }
    } catch {
      this.cartItemCount = 0;
    }
  }
}
