import { Component, OnInit, inject } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { signal } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-products-page',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './products-page.html',
  styleUrls: ['./products-page.scss']
})
export class ProductsPage implements OnInit {
  private productService = inject(ProductService);

  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.error.set(null);

    this.productService.loadProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load products');
        this.loading.set(false);
        console.error('Error loading products:', err);
      }
    });
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  addToCart(product: Product): void {
    // Add to cart functionality using localStorage
    let cartItems: any[] = [];

    // Get existing cart items from localStorage
    const cartData = localStorage.getItem('shoppingCart');
    if (cartData) {
      cartItems = JSON.parse(cartData);
    }

    // Check if product is already in cart
    const existingItemIndex = cartItems.findIndex(item => item.product.id === product.id);

    if (existingItemIndex > -1) {
      // Increase quantity if product already exists
      cartItems[existingItemIndex].quantity += 1;
    } else {
      // Add new product to cart
      cartItems.push({
        product: product,
        quantity: 1
      });
    }

    // Save updated cart to localStorage
    localStorage.setItem('shoppingCart', JSON.stringify(cartItems));

    // Show success message
    alert(`Added ${product.title} to cart!`);

    // Update cart icon count
    window.dispatchEvent(new Event('storage'));
  }
}