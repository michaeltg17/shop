import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductsPage } from './products-page';
import { ProductService } from '../../product.service';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Product } from '../../product';

describe('ProductsPage', () => {
  let component: ProductsPage;
  let fixture: ComponentFixture<ProductsPage>;
  let productService: Partial<ProductService>;

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
    // Clear localStorage before each test to ensure test isolation
    localStorage.clear();

    productService = {
      loadProducts: jest.fn().mockReturnValue(of([mockProduct])),
    };

    await TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [{ provide: ProductService, useValue: productService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clear localStorage after each test to prevent state leakage
    localStorage.clear();
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
    tick();
  }));

  it('should set loading to false when load succeeds', fakeAsync(() => {
    component.loadProducts();
    tick();
    expect(component.loading()).toBe(false);
    tick();
  }));

  it('should set error message when load fails', fakeAsync(() => {
    (productService.loadProducts as jest.Mock).mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    component.loadProducts();
    tick();
    expect(component.error()).toBe('Failed to load products');
    tick();
  }));

  it('should set loading to false when load fails', fakeAsync(() => {
    (productService.loadProducts as jest.Mock).mockReturnValue(
      throwError(() => new Error('Network error'))
    );
    component.loadProducts();
    tick();
    expect(component.loading()).toBe(false);
    tick();
  }));

  it('should track product by id', () => {
    expect(component.trackByProductId(0, mockProduct)).toBe(mockProduct.id);
  });

  it('should track product by id regardless of index', () => {
    expect(component.trackByProductId(5, mockProduct)).toBe(mockProduct.id);
    expect(component.trackByProductId(100, mockProduct)).toBe(mockProduct.id);
  });

  it('should add product to cart', () => {
    localStorage.clear();
    jest.spyOn(window, 'alert').mockImplementation(() => {
      /* empty */
    });
    component.addToCart(mockProduct);
    const cartData = localStorage.getItem('shoppingCart');
    const cart = cartData ? JSON.parse(cartData) : [];
    expect(cart.length).toBe(1);
    expect(cart[0].product.id).toBe(mockProduct.id);
    expect(cart[0].quantity).toBe(1);
  });

  it('should increase quantity when adding existing product to cart', () => {
    localStorage.clear();
    localStorage.setItem('shoppingCart', JSON.stringify([{ product: mockProduct, quantity: 1 }]));
    jest.spyOn(window, 'alert').mockImplementation(() => {
      /* empty */
    });
    component.addToCart(mockProduct);
    const cartData = localStorage.getItem('shoppingCart');
    const cart = cartData ? JSON.parse(cartData) : [];
    expect(cart[0].quantity).toBe(2);
  });

  it('should dispatch storage event after adding to cart', () => {
    localStorage.clear();
    const eventSpy = jest.spyOn(window, 'dispatchEvent');
    jest.spyOn(window, 'alert').mockImplementation(() => {
      /* empty */
    });
    component.addToCart(mockProduct);
    expect(eventSpy).toHaveBeenCalled();
  });

  it('should dispatch Event named storage after adding to cart', () => {
    localStorage.clear();
    jest.spyOn(window, 'alert').mockImplementation(() => {
      /* empty */
    });
    const eventSpy = jest.spyOn(window, 'dispatchEvent');
    component.addToCart(mockProduct);
    const dispatchedEvent = eventSpy.mock.calls[0][0] as Event;
    expect(dispatchedEvent.type).toBe('storage');
  });

  it('should handle invalid JSON in localStorage', () => {
    localStorage.clear();
    localStorage.setItem('shoppingCart', 'invalid-json-data');
    jest.spyOn(window, 'alert').mockImplementation(() => {
      /* empty */
    });

    component.addToCart(mockProduct);

    const cartData = localStorage.getItem('shoppingCart');
    const cart = cartData ? JSON.parse(cartData) : [];
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(1);
  });

  it('should show alert with product title when adding to cart', () => {
    localStorage.clear();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {
      /* empty */
    });
    component.addToCart(mockProduct);
    expect(alertSpy).toHaveBeenCalledWith(`Added ${mockProduct.title} to cart!`);
  });

  it('should add second product to cart as new item', () => {
    localStorage.clear();
    localStorage.setItem('shoppingCart', JSON.stringify([{ product: mockProduct, quantity: 1 }]));
    jest.spyOn(window, 'alert').mockImplementation(() => {
      /* empty */
    });
    const secondProduct: Product = {
      ...mockProduct,
      id: 2,
      title: 'Second Product',
    };
    component.addToCart(secondProduct);
    const cartData = localStorage.getItem('shoppingCart');
    const cart = cartData ? JSON.parse(cartData) : [];
    expect(cart.length).toBe(2);
    expect(cart[1].product.id).toBe(2);
    expect(cart[1].quantity).toBe(1);
  });

  it('should initialize products as empty array', () => {
    // Before loadProducts is called, products should be empty
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
