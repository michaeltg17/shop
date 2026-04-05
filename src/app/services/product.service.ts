import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  // Mock data for products
  private mockProducts: Product[] = [
    {
      id: 1,
      title: 'Product 1',
      description: 'This is the first product description. It contains detailed information about the product features and benefits.',
      price: 29.99,
      imageUrl: 'https://via.placeholder.com/300x200?text=Product+1'
    },
    {
      id: 2,
      title: 'Product 2',
      description: 'This is the second product description. It contains detailed information about the product features and benefits.',
      price: 39.99,
      imageUrl: 'https://via.placeholder.com/300x200?text=Product+2'
    },
    {
      id: 3,
      title: 'Product 3',
      description: 'This is the third product description. It contains detailed information about the product features and benefits.',
      price: 49.99,
      imageUrl: 'https://via.placeholder.com/300x200?text=Product+3'
    },
    {
      id: 4,
      title: 'Product 4',
      description: 'This is the fourth product description. It contains detailed information about the product features and benefits.',
      price: 59.99,
      imageUrl: 'https://via.placeholder.com/300x200?text=Product+4'
    },
    {
      id: 5,
      title: 'Product 5',
      description: 'This is the fifth product description. It contains detailed information about the product features and benefits.',
      price: 69.99,
      imageUrl: 'https://via.placeholder.com/300x200?text=Product+5'
    }
  ];

  products = signal<Product[]>(this.mockProducts);
  loading = signal(false);
  error = signal<string | null>(null);

  loadProducts() {
    this.loading.set(true);
    this.error.set(null);

    // Simulate API call
    setTimeout(() => {
      this.loading.set(false);
      this.products.set(this.mockProducts);
    }, 500);
  }

  getProductById(id: number): Product | undefined {
    return this.products().find(product => product.id === id);
  }

  addProduct(product: Omit<Product, 'id'>): void {
    const newProduct: Product = {
      ...product,
      id: this.generateId()
    };
    this.products.update(products => [...products, newProduct]);
  }

  updateProduct(updatedProduct: Product): void {
    this.products.update(products =>
      products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  }

  deleteProduct(id: number): void {
    this.products.update(products => products.filter(p => p.id !== id));
  }

  private generateId(): number {
    const ids = this.products().map(p => p.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }
}