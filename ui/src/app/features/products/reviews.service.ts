import { Injectable, signal } from '@angular/core';
import { Review } from './review';

const REVIEWS_STORAGE_KEY = 'angular-shop-reviews';

@Injectable({
  providedIn: 'root',
})
export class ReviewsService {
  private reviews = signal<Review[]>([]);

  reviews$ = this.reviews.asReadonly();

  constructor() {
    this.restoreFromStorage();
  }

  private persist(): void {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(this.reviews()));
    } catch {
      // Silently fail
    }
  }

  private restoreFromStorage(): void {
    try {
      const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (stored) {
        this.reviews.set(JSON.parse(stored));
      }
    } catch {
      // Silently fail
    }
  }

  getProductReviews(productId: number): Review[] {
    return this.reviews().filter(r => r.productId === productId);
  }

  addReview(review: Omit<Review, 'id' | 'createdAt'>): void {
    const maxId = this.reviews().reduce((max, r) => Math.max(max, r.id), 0);
    const newReview: Review = {
      ...review,
      id: maxId + 1,
      createdAt: new Date().toISOString(),
    };
    this.reviews.update(reviews => [...reviews, newReview]);
    this.persist();
  }
}
