import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderService, OrderResponse } from '../../../orders/order.service';
import { take } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-confirmation-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './confirmation-page.html',
  styleUrl: './confirmation-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationPage implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  orderId: number | null = null;
  order: OrderResponse | null = null;
  loading = true;
  error = false;

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.params['id'];
    this.orderId = Number(id);

    if (this.orderId) {
      this.orderService
        .getOrder(this.orderId)
        .pipe(take(1))
        .subscribe({
          next: order => {
            this.order = order;
            this.loading = false;
          },
          error: () => {
            this.error = true;
            this.loading = false;
          },
        });
    }
  }

  get formattedDate(): string {
    if (!this.order?.createdAt) return '';
    return new Date(this.order.createdAt).toLocaleString();
  }

  continueShopping(): void {
    this.router.navigate(['/shop/products']);
  }

  viewOrders(): void {
    this.router.navigate(['/shop/orders']);
  }
}
