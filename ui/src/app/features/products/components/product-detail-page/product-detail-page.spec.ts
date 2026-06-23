import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductDetailPage } from './product-detail-page';
import { ProductService } from '../../product.service';
import { ReviewsService } from '../../reviews.service';
import { CartService } from '../../../cart/cart.service';
import { Product } from '../../product';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('ProductDetailPage', () => {
  let component: ProductDetailPage;
  let fixture: ComponentFixture<ProductDetailPage>;

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
    navigate: jasmine.createSpy('navigate'),
  };

  const mockReviewsService = {
    getProductReviews: jasmine.createSpy('getProductReviews').and.returnValue([]),
    addReview: jasmine.createSpy('addReview'),
  };

  const mockCartService = {
    addToCart: jasmine.createSpy('addToCart'),
  };

  const mockSnackBar = {
    open: jasmine.createSpy('open'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ProductService,
          useValue: {
            loadProductById: jasmine.createSpy('loadProductById').and.returnValue(of(mockProduct)),
          },
        },
        { provide: ReviewsService, useValue: mockReviewsService },
        { provide: CartService, useValue: mockCartService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product on init', () => {
    component.ngOnInit();
    expect(component.loading()).toBeTrue();
    expect(component.error()).toBeNull();
  });

  it('should navigate back when goBack is called', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/shop/products']);
  });

  it('should add product to cart', () => {
    component.product.set(mockProduct);
    component.addToCart();
    expect(mockCartService.addToCart).toHaveBeenCalledWith(mockProduct, 1);
    expect(mockSnackBar.open).toHaveBeenCalled();
  });

  it('should not add to cart if no product', () => {
    component.addToCart();
    expect(mockCartService.addToCart).not.toHaveBeenCalled();
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
});
