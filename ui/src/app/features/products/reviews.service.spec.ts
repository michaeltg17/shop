import { ReviewsService } from './reviews.service';
import { Review } from './review';

describe('ReviewsService', () => {
  let service: ReviewsService;

  beforeEach(() => {
    localStorage.clear();
    service = new ReviewsService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty reviews for unknown product', () => {
    const reviews = service.getProductReviews(999);
    expect(reviews).toEqual([]);
  });

  it('should add a review with auto-generated id and createdAt', () => {
    const reviewInput = {
      productId: 1,
      author: 'TestUser',
      rating: 5,
      title: 'Great product',
      comment: 'Really nice',
    };

    service.addReview(reviewInput);

    const reviews = service.getProductReviews(1);
    expect(reviews.length).toBe(1);
    expect(reviews[0].id).toBe(1);
    expect(reviews[0].productId).toBe(1);
    expect(reviews[0].author).toBe('TestUser');
    expect(reviews[0].rating).toBe(5);
    expect(reviews[0].title).toBe('Great product');
    expect(reviews[0].comment).toBe('Really nice');
    expect(reviews[0].createdAt).toBeDefined();
  });

  it('should persist reviews to localStorage', () => {
    service.addReview({
      productId: 1,
      author: 'TestUser',
      rating: 4,
      title: 'Nice',
      comment: 'Good',
    });

    const stored = localStorage.getItem('angular-shop-reviews');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.length).toBe(1);
  });

  it('should restore reviews from localStorage on construction', () => {
    const existing: Review[] = [
      {
        id: 1,
        productId: 2,
        author: 'OldUser',
        rating: 3,
        title: 'Okay',
        comment: 'Meh',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];
    localStorage.setItem('angular-shop-reviews', JSON.stringify(existing));

    const freshService = new ReviewsService();
    const reviews = freshService.getProductReviews(2);
    expect(reviews.length).toBe(1);
    expect(reviews[0].author).toBe('OldUser');
  });

  it('should filter reviews by productId', () => {
    service.addReview({ productId: 1, author: 'A', rating: 5, title: 'T1', comment: 'C1' });
    service.addReview({ productId: 2, author: 'B', rating: 4, title: 'T2', comment: 'C2' });
    service.addReview({ productId: 1, author: 'C', rating: 3, title: 'T3', comment: 'C3' });

    expect(service.getProductReviews(1).length).toBe(2);
    expect(service.getProductReviews(2).length).toBe(1);
    expect(service.getProductReviews(3).length).toBe(0);
  });

  it('should increment id for each new review', () => {
    service.addReview({ productId: 1, author: 'A', rating: 5, title: 'T', comment: 'C' });
    service.addReview({ productId: 1, author: 'B', rating: 4, title: 'T', comment: 'C' });
    service.addReview({ productId: 2, author: 'C', rating: 3, title: 'T', comment: 'C' });

    const reviews = service.getProductReviews(1);
    expect(reviews[0].id).toBe(1);
    expect(reviews[1].id).toBe(2);

    const reviews2 = service.getProductReviews(2);
    expect(reviews2[0].id).toBe(3);
  });

  it('should expose reviews$ signal', () => {
    expect(service.reviews$).toBeDefined();
    service.addReview({ productId: 1, author: 'A', rating: 5, title: 'T', comment: 'C' });
    expect(service.reviews$().length).toBe(1);
  });
});
