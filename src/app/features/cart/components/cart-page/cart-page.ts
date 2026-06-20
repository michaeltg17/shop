import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartItem } from '../../cart-item';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../cart.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPage {
  private router = inject(Router);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);

  shipping = 5.99;

  cartItems = this.cartService.cartItems$;

  allSelected = signal(true);

  constructor() {
    effect(() => {
      const items = this.cartItems();
      this.allSelected.set(items.length > 0 && items.every(i => i.selected));
    });
  }

  get subtotal(): number {
    return this.cartService.getSubtotal();
  }

  get total(): number {
    return this.subtotal + this.shipping;
  }

  get selectedItems(): CartItem[] {
    return this.cartService.getSelectedItems();
  }

  toggleItemSelection(item: CartItem): void {
    this.cartService.toggleItemSelection(item.product.id);
  }

  toggleAll(): void {
    const newVal = !this.allSelected();
    this.cartService.selectAllItems(newVal);
    this.allSelected.set(newVal);
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
    this.snackBar.open(`Removed ${item.product.title} from cart`, 'Close', { duration: 2000 });
  }

  checkout(): void {
    const selected = this.selectedItems;
    if (selected.length === 0) {
      this.snackBar.open('Select at least one item to checkout', 'Close', { duration: 3000 });
      return;
    }

    this.cartService.clearCart();
    this.snackBar.open('Order placed successfully!', 'Close', { duration: 3000 });
    this.router.navigate(['/shop/products']);
  }
}
