import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ProductsPage } from './products-page';
import { ProductService } from '../../product.service';
import { CartService } from '../../../cart/cart.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Product } from '../../product';
import { ActivatedRoute, Router } from '@angular/router';

class MatSnackBarStub {
  open = jest.fn();
}

describe('ProductsPage', () => {
  let component: ProductsPage;
  let fixture: ComponentFixture<ProductsPage>;
  let productService: Partial<ProductService>;
  let cartService: Partial<CartService>;
  let snackBarStub: MatSnackBarStub;

  const mockProduct: Product = {
    id: 1,
    title: 'Test Product',
    description: 'Test Description',
    price: 10.99,
    category: 'Test Category',
    image: 'https://example.com/image.jpg',
    rating: { rate: 4.5, count: 10 },
  };

  beforeEach(async () => {
    productService = {
      loadProducts: jest.fn().mockReturnValue(of([mockProduct])),
    };

    cartService = {
      addToCart: jest.fn(),
    };

    snackBarStub = new MatSnackBarStub();

    await TestBed.configureTestingModule({
      declarations: [],
      imports: [ProductsPage],
      providers: [
        { provide: ProductService, useValue: productService },
        { provide: CartService, useValue: cartService },
        { provide: MatSnackBar, useValue: snackBarStub },
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} }, paramMap: {} } },
        {
          provide: Router,
          useValue: { navigate: jest.fn().mockReturnValue(Promise.resolve(true)) },
        },
      ],
    })
      .overrideComponent(ProductsPage, {
        remove: {
          imports: [MatSnackBarModule],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    component.ngOnInit();
    expect(productService.loadProducts).toHaveBeenCalled();
  });

  it('should set loading to true when loading products', fakeAsync(() => {
    (productService.loadProducts as jest.Mock).mockReturnValue(of([mockProduct]).pipe(delay(10)));
    component.loading.set(false);
    component.loadProducts();
    expect(component.loading()).toBe(true);
    tick(10);
    expect(component.loading()).toBe(false);
  }));

  it('should set error to null when starting load', () => {
    component.error.set('previous error');
    component.loadProducts();
    expect(component.error()).toBeNull();
  });

  it('should set products when load succeeds', fakeAsync(() => {
    component.loadProducts();
    tick();
    expect(component.products()).toEqual([mockProduct]);
  }));

  it('should set loading to false when load succeeds', fakeAsync(() => {
    component.loadProducts();
    tick();
    expect(component.loading()).toBe(false);
  }));

  it('should set error message when load fails', fakeAsync(() => {
    (productService.loadProducts as jest.Mock).mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    component.loadProducts();
    tick();
    expect(component.error()).toBe('Failed to load products');
  }));

  it('should set loading to false when load fails', fakeAsync(() => {
    (productService.loadProducts as jest.Mock).mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    component.loadProducts();
    tick();
    expect(component.loading()).toBe(false);
  }));

  it('should track product by id', () => {
    expect(component.trackByProductId(0, mockProduct)).toBe(mockProduct.id);
  });

  it('should track product by id regardless of index', () => {
    expect(component.trackByProductId(5, mockProduct)).toBe(mockProduct.id);
    expect(component.trackByProductId(100, mockProduct)).toBe(mockProduct.id);
  });

  it('should add product to cart via CartService', () => {
    component.addToCart(mockProduct);
    expect(cartService.addToCart).toHaveBeenCalledWith(mockProduct, 1);
  });

  it('should show snackbar when adding to cart', () => {
    component.addToCart(mockProduct);
    expect(snackBarStub.open).toHaveBeenCalledWith(`Added ${mockProduct.title} to cart!`, 'Close', {
      duration: 3000,
    });
  });

  it('should add second product to cart as separate call', () => {
    const secondProduct: Product = {
      ...mockProduct,
      id: 2,
      title: 'Second Product',
    };
    component.addToCart(mockProduct);
    component.addToCart(secondProduct);
    expect(cartService.addToCart).toHaveBeenCalledTimes(2);
    expect(cartService.addToCart).toHaveBeenNthCalledWith(1, mockProduct, 1);
    expect(cartService.addToCart).toHaveBeenNthCalledWith(2, secondProduct, 1);
  });

  it('should initialize products as empty array', () => {
    const freshComponent = TestBed.createComponent(ProductsPage).componentInstance;
    expect(freshComponent.products()).toEqual([]);
  });

  it('should initialize loading as false', () => {
    const freshComponent = TestBed.createComponent(ProductsPage).componentInstance;
    expect(freshComponent.loading()).toBe(false);
  });

  it('should initialize error as null', () => {
    const freshComponent = TestBed.createComponent(ProductsPage).componentInstance;
    expect(freshComponent.error()).toBeNull();
  });
});
