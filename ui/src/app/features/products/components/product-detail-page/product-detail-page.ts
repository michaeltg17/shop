import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../product.service';
import { Product } from '../../product';
import { ReviewsService } from '../../reviews.service';
import { Review } from '../../review';
import { CartService } from '../../../cart/cart.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './product-detail-page.html',
  styleUrls: ['./product-detail-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private reviewsService = inject(ReviewsService);
  private cartService = inject(CartService);
  private snackBar = inject(MatSnackBar);

  product = signal<Product | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  reviews = signal<Review[]>([]);
  selectedImageIndex = signal(0);

  // Review form
  newRating = signal(0);
  newTitleControl = new FormControl('', [Validators.required, Validators.maxLength(100)]);
  newCommentControl = new FormControl('', [Validators.required, Validators.maxLength(500)]);
  submittingReview = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Invalid product ID');
      this.loading.set(false);
      return;
    }
    this.loadProduct(id);
  }

  loadProduct(id: number) {
    this.loading.set(true);
    this.error.set(null);

    this.productService.loadProductById(id).subscribe({
      next: product => {
        this.product.set(product);
        this.reviews.set(this.reviewsService.getProductReviews(id));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load product details');
        this.loading.set(false);
      },
    });
  }

  selectImage(index: number) {
    this.selectedImageIndex.set(index);
  }

  getImages(): string[] {
    const p = this.product();
    if (!p || !p.image) return [];

    const base = p.image;
    return [
      base,
      this.variantUrl(base, 'angle'),
      this.variantUrl(base, 'detail'),
      this.variantUrl(base, 'packaging'),
    ];
  }

  private variantUrl(base: string, variant: string): string {
    const url = new URL(base);
    url.searchParams.set('variant', variant);
    return url.toString();
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    this.cartService.addToCart(p, 1);
    this.snackBar.open(`Added ${p.title} to cart!`, 'Close', { duration: 3000 });
  }

  submitReview(): void {
    const p = this.product();
    if (
      !p ||
      !this.newTitleControl.value ||
      !this.newCommentControl.value ||
      this.newRating() === 0
    ) {
      this.snackBar.open('Please fill in all review fields', 'Close', { duration: 3000 });
      return;
    }

    this.submittingReview.set(true);
    this.reviewsService.addReview({
      productId: p.id,
      author: 'Customer',
      rating: this.newRating(),
      title: this.newTitleControl.value!,
      comment: this.newCommentControl.value!,
    });
    this.reviews.set(this.reviewsService.getProductReviews(p.id));
    this.newRating.set(0);
    this.newTitleControl.setValue('');
    this.newCommentControl.setValue('');
    this.submittingReview.set(false);
    this.snackBar.open('Review submitted!', 'Close', { duration: 3000 });
  }

  goBack(): void {
    this.router.navigate(['/shop/products']);
  }

  formatReviewDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getStars(rating: number): number[] {
    const rounded = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => i + 1).filter(n => n <= rounded);
  }

  getEmptyStars(rating: number): number[] {
    const rounded = Math.round(rating);
    return Array.from({ length: 5 }, (_, i) => i + 1).filter(n => n > rounded);
  }

  getRatingStars(rating: number): number[] {
    return this.getStars(rating);
  }

  getRatingEmptyStars(rating: number): number[] {
    return this.getEmptyStars(rating);
  }
}
