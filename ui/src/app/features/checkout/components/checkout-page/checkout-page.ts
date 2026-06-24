import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CheckoutService } from '../../services/checkout.service';
import { ShippingStep } from '../shipping-step/shipping-step';
import { PaymentStep } from '../payment-step/payment-step';
import { ReviewStep } from '../review-step/review-step';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    ShippingStep,
    PaymentStep,
    ReviewStep,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPage {
  private checkoutService = inject(CheckoutService);
  private snackBar = inject(MatSnackBar);

  stepLabels = ['Shipping', 'Payment', 'Review'];

  currentStep = computed(() => this.checkoutService.getCurrentStep());

  next(): void {
    const s = this.checkoutService.getState();
    if (s.step === 0) {
      if (
        !s.shipping.name.trim() ||
        !s.shipping.addressLine1.trim() ||
        !s.shipping.city.trim() ||
        !s.shipping.state.trim() ||
        !s.shipping.zip.trim() ||
        !s.shipping.country.trim()
      ) {
        this.snackBar.open('Please fill in all required shipping fields', 'Close', {
          duration: 3000,
        });
        return;
      }
    }
    if (s.step === 1) {
      if (s.payment.method === 'card') {
        if (
          !s.payment.cardName.trim() ||
          s.payment.cardNumber.replace(/\s/g, '').length !== 16 ||
          !s.payment.cvv
        ) {
          this.snackBar.open('Please fill in all payment fields', 'Close', { duration: 3000 });
          return;
        }
      }
    }

    this.checkoutService.setCurrentStep(s.step + 1);
  }

  back(): void {
    const s = this.checkoutService.getState();
    if (s.step > 0) {
      this.checkoutService.setCurrentStep(s.step - 1);
    }
  }

  placeOrder(): void {
    this.checkoutService.placeOrder();
  }
}
