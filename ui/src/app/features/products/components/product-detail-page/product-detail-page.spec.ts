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
  let cartService: { addToCart: jest.Mock };
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
        addProviders: [{ provide: MatSnackBar, useValue: snackBar }],
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProductDetailPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product on init', () => {
    // ProductService.loadProductById is called with correct ID from route
    expect(productServiceMock.loadProductById).toHaveBeenCalledWith(1);
    // After synchronous resolution of of(), loading is false and product is set
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
    // Reset mocks for clean test isolation
    cartService.addToCart.mockClear();
    snackBar.open.mockClear();
    // Set product to null explicitly
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
});
