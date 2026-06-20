import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from './product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly productsUrl = 'api/products';

  loadProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.productsUrl);
  }
}
