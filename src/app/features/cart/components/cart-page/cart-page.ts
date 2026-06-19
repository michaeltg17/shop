import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartItem } from '../../cart-item';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-page.html',
  styleUrls: ['./cart-page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  private router = inject(Router);
  private cartService = inject(CartService);

  shipping = 5.99;

  get cartItems(): CartItem[] {
    return this.cartService.cartItems$();
  }

  get subtotal(): number {
    return this.cartService.getSubtotal();
  }

  get total(): number {
    return this.subtotal + this.shipping;
  }

  updateQuantity(item: CartItem, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.removeItem(item);
      return;
    }

    this.cartService.updateQuantity(item.product.id, newQuantity);
  }

  removeItem(item: CartItem): void {
    this.cartService.removeFromCart(item.product.id);
  }

  checkout(): void {
    if (this.cartItems.length === 0) {
      return;
    }

    // In a real application, this would navigate to a checkout page
    // For now, we'll just clear the cart and redirect
    this.cartService.clearCart();
    this.router.navigate(['/shop/products']);
  }
}
