import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { CheckoutService } from '../../services/checkout.service';

@Component({
  selector: 'app-payment-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatRadioModule,
  ],
  templateUrl: './payment-step.html',
  styleUrl: './payment-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentStep implements OnInit {
  private checkoutService = inject(CheckoutService);

  method: 'card' | 'paypal' | 'placeholder' = 'placeholder';
  cardName = '';
  cardNumber = '';
  expiry = '';
  cvv = '';

  ngOnInit(): void {
    const payment = this.checkoutService.getPayment();
    this.method = payment.method;
    this.cardName = payment.cardName;
    this.cardNumber = payment.cardNumber;
    this.expiry = payment.expiry;
    this.cvv = payment.cvv;
  }

  update(): void {
    this.checkoutService.updatePayment({
      method: this.method,
      cardName: this.cardName,
      cardNumber: this.cardNumber,
      expiry: this.expiry,
      cvv: this.cvv,
    });
  }

  formatCardNumber(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber = digits.replace(/(.{4})/g, '$1 ').trim();
    this.update();
  }

  formatExpiry(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      this.expiry = digits.slice(0, 2) + '/' + digits.slice(2);
    } else {
      this.expiry = digits;
    }
    this.update();
  }
}
