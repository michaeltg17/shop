import { inject, Injectable, signal } from '@angular/core';
import { Customer } from './customer';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { EMPTY } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private customersUrl = 'api/customers';
  customers = signal<Customer[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  private readonly http = inject(HttpClient);

  loadCustomers() {
    // Skip API call if customers are already loaded
    if (this.customers().length > 0) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<Customer[]>(this.customersUrl)
      .pipe(
        tap(customers => {
          customers.forEach(c => {
            if (typeof c.isActive === 'string') {
              c.isActive = c.isActive === 'true';
            }
          });
          this.customers.set(customers);
        }),
        catchError(() => {
          this.error.set('Failed to load customers');
          this.loading.set(false);
          return of([]);
        })
      )
      .subscribe({
        complete: () => this.loading.set(false),
      });
  }

  addCustomer(customer: Customer) {
    this.http
      .post<Customer>(this.customersUrl, customer)
      .pipe(
        tap(newCustomer => {
          const current = this.customers();
          this.customers.set([...current, newCustomer]);
        }),
        catchError(() => {
          this.error.set('Failed to add customer');
          return EMPTY;
        })
      )
      .subscribe();
  }

  updateCustomer(customer: Customer) {
    this.http
      .put<Customer>(`${this.customersUrl}/${customer.id}`, customer)
      .pipe(
        tap(() => {
          const current = this.customers();
          const index = current.findIndex(c => c.id === customer.id);
          if (index !== -1) {
            const updated = [...current];
            updated[index] = customer;
            this.customers.set(updated);
          }
        }),
        catchError(() => {
          this.error.set('Failed to update customer');
          return EMPTY;
        })
      )
      .subscribe();
  }

  deleteCustomers(ids: number[]) {
    this.http
      .delete(this.customersUrl, { body: ids })
      .pipe(
        tap(() => {
          const current = this.customers();
          this.customers.set(current.filter(c => !ids.includes(c.id)));
        }),
        catchError(() => {
          this.error.set('Failed to delete customers');
          return EMPTY;
        })
      )
      .subscribe();
  }
}
