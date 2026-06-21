import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface User {
  username: string;
  isAdmin: boolean;
}

export interface CustomerCredentials {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'angular_auth_user';
  private readonly CUSTOMERS_KEY = 'angular_customers';

  isAuthenticated = signal<boolean>(this.hasStoredUser());
  user = signal<User | null>(this.getStoredUser());

  get authState(): Observable<User | null> {
    return of(this.getStoredUser());
  }

  login(username: string, password: string): Observable<boolean> {
    // Admin authentication
    if (username === 'admin' && password === 'password') {
      const user: User = { username, isAdmin: true };
      this.setAuth(user);
      return of(true);
    }

    // Customer authentication
    const customer = this.findCustomer(username, password);
    if (customer) {
      const user: User = { username: customer.username, isAdmin: false };
      this.setAuth(user);
      return of(true);
    }

    return of(false);
  }

  register(username: string, password: string): Observable<boolean> {
    if (!username || !password) {
      return of(false);
    }

    // Check if username already exists (as customer or admin)
    if (username === 'admin') {
      return of(false);
    }

    const existing = this.getStoredCustomers().find(c => c.username === username);
    if (existing) {
      return of(false);
    }

    const customers = this.getStoredCustomers();
    customers.push({ username, password });
    this.saveCustomers(customers);

    // Auto-login after registration
    const user: User = { username, isAdmin: false };
    this.setAuth(user);
    return of(true);
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.isAuthenticated.set(false);
    this.user.set(null);
  }

  private hasStoredUser(): boolean {
    try {
      return !!localStorage.getItem(this.STORAGE_KEY);
    } catch {
      return false;
    }
  }

  private getStoredUser(): User | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private setAuth(user: User): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    } catch {
      /* quota exceeded */
    }
    this.isAuthenticated.set(true);
    this.user.set(user);
  }

  private getStoredCustomers(): CustomerCredentials[] {
    try {
      const data = localStorage.getItem(this.CUSTOMERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveCustomers(customers: CustomerCredentials[]): void {
    try {
      localStorage.setItem(this.CUSTOMERS_KEY, JSON.stringify(customers));
    } catch {
      /* quota exceeded */
    }
  }

  private findCustomer(username: string, password: string): CustomerCredentials | undefined {
    return this.getStoredCustomers().find(c => c.username === username && c.password === password);
  }
}
