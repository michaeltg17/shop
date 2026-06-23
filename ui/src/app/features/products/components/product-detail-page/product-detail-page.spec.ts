import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductDetailPage } from './product-detail-page';
import { ProductService } from '../../product.service';
import { ReviewsService } from '../../reviews.service';
import { Product } from '../../product';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CartService } from '../../../cart/cart.service';

describe('ProductDetailPage', () => {
  let component: ProductDetailPage;
  let fixture: ComponentFixture<ProductDetailPage>;
  let cartService: {
    addToCart: jest.Mock;
    removeFromCart: jest.Mock;
    updateQuantity: jest.Mock;
    toggleItemSelection: jest.Mock;
    selectAllItems: jest.Mock;
    clearCart: jest.Mock;
    getSubtotal: jest.Mock;
    getSelectedItems: jest.Mock;
    getAllItems: jest.Mock;
    placeOrder: jest.Mock;
  };
  let snackBar: { open: jest.Mock };

  const mockProduct: Product = {
    id: 1,
    title: 'Laptop',
    description: 'High-performance laptop',
    price: 999.99,
    category: 'Electronics',
    image: 'https://placehold.co/400x300',
    rating: { rate: 4.5, count: 120 },
  };

  const mockActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({ id: '1' }),
    },
  };

  const mockRouter = {
    navigate: jest.fn().mockResolvedValue(true),
  };

  const mockReviewsService = {
    getProductReviews: jest.fn().mockReturnValue([]),
    addReview: jest.fn(),
  };

  const productServiceMock = {
    loadProductById: jest.fn().mockReturnValue(of(mockProduct)),
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();

    cartService = {
      addToCart: jest.fn(),
      removeFromCart: jest.fn(),
      updateQuantity: jest.fn(),
      toggleItemSelection: jest.fn(),
      selectAllItems: jest.fn(),
      clearCart: jest.fn(),
      getSubtotal: jest.fn().mockReturnValue(0),
      getSelectedItems: jest.fn().mockReturnValue([]),
      getAllItems: jest.fn().mockReturnValue([]),
      placeOrder: jest.fn(),
    };

    snackBar = {
      open: jest.fn(),
    };

    productServiceMock.loadProductById.mockReturnValue(of(mockProduct));

    await TestBed.configureTestingModule({
      imports: [ProductDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ProductService,
          useValue: productServiceMock,
        },
        { provide: ReviewsService, useValue: mockReviewsService },
        { provide: CartService, useValue: cartService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(ProductDetailPage, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProductDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product on init', () => {
    expect(productServiceMock.loadProductById).toHaveBeenCalledWith(1);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.product()).toBeTruthy();
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/shop/products']);
  });

  it('should add product to cart', () => {
    component.product.set(mockProduct);
    component.addToCart();
    expect(cartService.addToCart).toHaveBeenCalledWith(mockProduct, 1);
    expect(snackBar.open).toHaveBeenCalled();
  });

  it('should not add to cart if no product', () => {
    cartService.addToCart.mockClear();
    snackBar.open.mockClear();
    component.product.set(null);
    component.addToCart();
    expect(cartService.addToCart).not.toHaveBeenCalled();
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('should select image', () => {
    component.selectImage(2);
    expect(component.selectedImageIndex()).toBe(2);
  });

  it('should return multiple image URLs', () => {
    component.product.set(mockProduct);
    const images = component.getImages();
    expect(images.length).toBe(4);
  });

  it('should format review date', () => {
    const formatted = component.formatReviewDate('2026-06-23T00:00:00Z');
    expect(formatted).toContain('Jun');
  });

  it('should set error on invalid product ID', async () => {
    const noIdRoute = {
      snapshot: {
        paramMap: convertToParamMap({}),
      },
    };

    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [ProductDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProductService, useValue: productServiceMock },
        { provide: ReviewsService, useValue: mockReviewsService },
        { provide: CartService, useValue: cartService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ActivatedRoute, useValue: noIdRoute },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(ProductDetailPage, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    const newFixture = TestBed.createComponent(ProductDetailPage);
    newFixture.detectChanges();

    expect(newFixture.componentInstance.error()).toBe('Invalid product ID');
    expect(newFixture.componentInstance.loading()).toBe(false);
  });

  it('should submit a review', () => {
    component.product.set(mockProduct);
    component.newRating.set(5);
    component.newTitleControl.setValue('Great product');
    component.newCommentControl.setValue('Really good');

    component.submitReview();

    expect(mockReviewsService.addReview).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 1,
        author: 'Customer',
        rating: 5,
        title: 'Great product',
        comment: 'Really good',
      })
    );
    expect(snackBar.open).toHaveBeenCalledWith('Review submitted!', 'Close', { duration: 3000 });
    expect(component.newRating()).toBe(0);
    expect(component.newTitleControl.value).toBe('');
    expect(component.newCommentControl.value).toBe('');
  });

  it('should not submit review if fields missing', () => {
    snackBar.open.mockClear();
    mockReviewsService.addReview.mockClear();
    component.product.set(mockProduct);
    // Missing rating
    component.newRating.set(0);
    component.newTitleControl.setValue('');
    component.newCommentControl.setValue('');

    component.submitReview();

    expect(mockReviewsService.addReview).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Please fill in all review fields', 'Close', {
      duration: 3000,
    });
  });

  it('should get stars for a rating', () => {
    expect(component.getStars(4).length).toBe(4);
    expect(component.getStars(0).length).toBe(0);
    expect(component.getStars(5).length).toBe(5);
  });

  it('should get empty stars for a rating', () => {
    expect(component.getEmptyStars(3).length).toBe(2);
    expect(component.getEmptyStars(5).length).toBe(0);
    expect(component.getEmptyStars(0).length).toBe(5);
  });

  it('should handle product loading error', async () => {
    const errorProductService = {
      loadProductById: jest.fn().mockReturnValue(throwError(() => new Error('Network error'))),
    };

    TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [ProductDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProductService, useValue: errorProductService },
        { provide: ReviewsService, useValue: mockReviewsService },
        { provide: CartService, useValue: cartService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(ProductDetailPage, {
        remove: { imports: [MatSnackBarModule] },
      })
      .compileComponents();

    const errFixture = TestBed.createComponent(ProductDetailPage);
    errFixture.detectChanges();

    expect(errFixture.componentInstance.error()).toBe('Failed to load product details');
    expect(errFixture.componentInstance.loading()).toBe(false);
  });

  it('should return empty images array when no product', () => {
    component.product.set(null);
    expect(component.getImages()).toEqual([]);
  });

  it('should goBack to products page', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/shop/products']);
  });
});
