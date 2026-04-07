import { Injectable, signal } from '@angular/core';
import { Customer } from './customer';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private customersUrl = 'api/customers';
  customers = signal<Customer[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  loadCustomers() {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<Customer[]>(this.customersUrl).pipe(
      tap(customers => {
        customers.forEach(c => {
          if (typeof c.isActive === 'string') {
            c.isActive = c.isActive === 'true';
          }
        });
        this.customers.set(customers);
      }),
      catchError(err => {
        console.error('Error loading customers:', err);
        this.error.set('Failed to load customers');
        this.loading.set(false);
        return of([]);
      })
    ).subscribe({
      complete: () => this.loading.set(false)
    });
  }

  addCustomer(customer: Customer) {
    this.http.post<Customer>(this.customersUrl, customer).pipe(
      tap(newCustomer => {
        const current = this.customers();
        this.customers.set([...current, newCustomer]);
      }),
      catchError(err => {
        console.error('Error adding customer:', err);
        this.error.set('Failed to add customer');
        return throwError(() => err);
      })
    ).subscribe();
  }

  updateCustomer(customer: Customer) {
    this.http.put<Customer>(`${this.customersUrl}/${customer.id}`, customer).pipe(
      tap(() => {
        const current = this.customers();
        const index = current.findIndex(c => c.id === customer.id);
        if (index !== -1) {
          const updated = [...current];
          updated[index] = customer;
          this.customers.set(updated);
        }
      }),
      catchError(err => {
        console.error('Error updating customer:', err);
        this.error.set('Failed to update customer');
        return throwError(() => err);
      })
    ).subscribe();
  }

  deleteCustomers(ids: number[]) {
    ids.forEach(id => {
      this.http.delete(`${this.customersUrl}/${id}`).pipe(
        tap(() => {
          const current = this.customers();
          this.customers.set(current.filter(c => c.id !== id));
        }),
        catchError(err => {
          console.error('Error deleting customer:', err);
          this.error.set('Failed to delete customer');
          return throwError(() => err);
        })
      ).subscribe();
    });
  }
}