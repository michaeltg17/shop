import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { CheckoutService } from '../../services/checkout.service';
import { CartService } from '../../../cart/cart.service';

@Component({
  selector: 'app-review-step',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatDividerModule],
  templateUrl: './review-step.html',
  styleUrl: './review-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewStep {
  private checkoutService = inject(CheckoutService);
  private cartService = inject(CartService);

  get shipping() {
    return this.checkoutService.getShipping();
  }

  get payment() {
    return this.checkoutService.getPayment();
  }

  get selectedItems() {
    return this.cartService.getSelectedItems();
  }

  get subtotal() {
    return this.checkoutService.subtotal;
  }

  get shippingCost() {
    return this.checkoutService.shippingTotal;
  }

  get total() {
    return this.checkoutService.total;
  }

  get paymentMethodLabel(): string {
    switch (this.payment.method) {
      case 'card':
        return `Card ending in ${this.payment.cardNumber.slice(-4)}`;
      case 'paypal':
        return 'PayPal';
      case 'placeholder':
        return 'Test Mode (No real payment)';
      default:
        return 'N/A';
    }
  }
}
