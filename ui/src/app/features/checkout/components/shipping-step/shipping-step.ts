import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CheckoutService } from '../../services/checkout.service';

@Component({
  selector: 'app-shipping-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './shipping-step.html',
  styleUrl: './shipping-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShippingStep implements OnInit {
  private checkoutService = inject(CheckoutService);

  name = '';
  addressLine1 = '';
  addressLine2 = '';
  city = '';
  state = '';
  zip = '';
  country = '';

  ngOnInit(): void {
    const s = this.checkoutService.getShipping();
    this.name = s.name;
    this.addressLine1 = s.addressLine1;
    this.addressLine2 = s.addressLine2;
    this.city = s.city;
    this.state = s.state;
    this.zip = s.zip;
    this.country = s.country;
  }

  update(): void {
    this.checkoutService.updateShipping({
      name: this.name,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      state: this.state,
      zip: this.zip,
      country: this.country,
    });
  }
}
