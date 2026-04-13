import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductsPage } from './products-page';
import { ProductService } from '../../product.service';
import { of } from 'rxjs';
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
    productService = {
      loadProducts: vi.fn().mockReturnValue(of([mockProduct])),
    };

    await TestBed.configureTestingModule({
      imports: [ProductsPage],
      providers: [{ provide: ProductService, useValue: productService }],
    }).compileComponents();

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

  it('should track product by id', () => {
    expect(component.trackByProductId(0, mockProduct)).toBe(mockProduct.id);
  });

  it('should add product to cart', () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    component.addToCart(mockProduct);
    const cart = JSON.parse(localStorage.getItem('shoppingCart') || '[]');
    expect(cart.length).toBe(1);
    expect(cart[0].product.id).toBe(mockProduct.id);
    expect(cart[0].quantity).toBe(1);
  });

  it('should increase quantity when adding existing product to cart', () => {
    localStorage.setItem('shoppingCart', JSON.stringify([{ product: mockProduct, quantity: 1 }]));
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    component.addToCart(mockProduct);
    const cart = JSON.parse(localStorage.getItem('shoppingCart') || '[]');
    expect(cart[0].quantity).toBe(2);
  });

  it('should dispatch storage event after adding to cart', () => {
    const eventSpy = vi.spyOn(window, 'dispatchEvent');
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    component.addToCart(mockProduct);
    expect(eventSpy).toHaveBeenCalled();
  });
});