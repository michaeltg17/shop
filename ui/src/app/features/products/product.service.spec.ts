import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { Product } from './product';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load products from API', () => {
    const mockProducts: Product[] = [
      {
        id: 1,
        title: 'Test Product',
        description: 'Test Description',
        price: 10.99,
        category: 'Test Category',
        image: 'https://example.com/image.jpg',
        rating: { rate: 4.5, count: 10 },
      },
    ];

    let receivedProducts: Product[] | undefined;

    service.loadProducts().subscribe(products => {
      receivedProducts = products;
    });

    const req = httpMock.expectOne('api/products');
    expect(req.request.method).toBe('GET');
    req.flush(mockProducts);

    expect(receivedProducts).toEqual(mockProducts);
  });

  it('should handle API error', () => {
    let receivedError: unknown;

    service.loadProducts().subscribe({
      next: () => {
        throw new Error('should have failed');
      },
      error: err => {
        receivedError = err;
      },
    });

    const req = httpMock.expectOne('api/products');
    req.flush('Error message', { status: 500, statusText: 'Server Error' });

    expect(receivedError).toBeTruthy();
  });

  it('should return empty array on empty response', () => {
    let receivedProducts: Product[] | undefined;

    service.loadProducts().subscribe(products => {
      receivedProducts = products;
    });

    const req = httpMock.expectOne('api/products');
    req.flush([]);

    expect(receivedProducts).toEqual([]);
  });

  it('should load a single product by id', () => {
    const mockProduct: Product = {
      id: 1,
      title: 'Test Product',
      description: 'Test Description',
      price: 10.99,
      category: 'Test Category',
      image: 'https://example.com/image.jpg',
      rating: { rate: 4.5, count: 10 },
    };

    let receivedProduct: Product | undefined;

    service.loadProductById(1).subscribe(product => {
      receivedProduct = product;
    });

    const req = httpMock.expectOne('api/products/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockProduct);

    expect(receivedProduct).toEqual(mockProduct);
  });
});
