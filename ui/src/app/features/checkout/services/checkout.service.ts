import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ShippingAddress, emptyShipping, isShippingValid } from '../models/shipping-address';
import { PaymentInfo, emptyPayment, isPaymentValid } from '../models/payment-info';
import { CartService } from '../../cart/cart.service';
import { OrderService, OrderRequest } from '../../orders/order.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/services/auth.service';

export interface CheckoutState {
  step: number; // 0=shipping, 1=payment, 2=review
  shipping: ShippingAddress;
  payment: PaymentInfo;
}

export function initialCheckoutState(): CheckoutState {
  return {
    step: 0,
    shipping: emptyShipping(),
    payment: emptyPayment(),
  };
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  private state = signal<CheckoutState>(initialCheckoutState());

  getState(): CheckoutState {
    return this.state();
  }

  getShipping(): ShippingAddress {
    return this.state().shipping;
  }

  getPayment(): PaymentInfo {
    return this.state().payment;
  }

  getCurrentStep(): number {
    return this.state().step;
  }

  setCurrentStep(step: number): void {
    this.state.update(s => ({ ...s, step }));
  }

  updateShipping(patch: Partial<ShippingAddress>): void {
    this.state.update(s => ({
      ...s,
      shipping: { ...s.shipping, ...patch },
    }));
  }

  updatePayment(patch: Partial<PaymentInfo>): void {
    this.state.update(s => ({
      ...s,
      payment: { ...s.payment, ...patch },
    }));
  }

  canProceed(): boolean {
    const s = this.state();
    if (s.step === 0) return isShippingValid(s.shipping);
    if (s.step === 1) return isPaymentValid(s.payment);
    return true; // review step always proceedable
  }

  readonly shippingTotal = 5.99;

  get subtotal(): number {
    return this.cartService.getSubtotal();
  }

  get total(): number {
    return this.subtotal + this.shippingTotal;
  }

  placeOrder(): void {
    const s = this.state();
    const selected = this.cartService.getSelectedItems();

    if (selected.length === 0) {
      this.snackBar.open('Your cart is empty. Add items before checkout.', 'Close', {
        duration: 4000,
      });
      return;
    }

    if (!isShippingValid(s.shipping)) {
      this.snackBar.open('Please review your shipping address.', 'Close', {
        duration: 4000,
      });
      this.setCurrentStep(0);
      return;
    }

    if (!isPaymentValid(s.payment)) {
      this.snackBar.open('Please review your payment details.', 'Close', {
        duration: 4000,
      });
      this.setCurrentStep(1);
      return;
    }

    const request: OrderRequest = {
      items: selected.map(item => ({
        productId: item.product.id,
        productName: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
      })),
      shipping: this.shippingTotal,
      customerId: this.authService.getUserId(),
      shippingName: s.shipping.name,
      shippingAddressLine1: s.shipping.addressLine1,
      shippingAddressLine2: s.shipping.addressLine2,
      shippingCity: s.shipping.city,
      shippingState: s.shipping.state,
      shippingZip: s.shipping.zip,
      shippingCountry: s.shipping.country,
    };

    this.orderService.createOrder(request).subscribe({
      next: order => {
        this.cartService.clearCart();
        this.reset();
        this.snackBar.open(`Order #${order.id} placed successfully!`, 'Close', {
          duration: 4000,
        });
        this.router.navigate(['/shop/checkout/confirmation', order.id]);
      },
      error: () => {
        this.snackBar.open('Failed to place order. Please try again.', 'Close', {
          duration: 4000,
        });
      },
    });
  }

  reset(): void {
    this.state.set(initialCheckoutState());
  }
}
