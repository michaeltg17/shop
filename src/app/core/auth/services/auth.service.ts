import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface User {
  username: string;
  isAdmin: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly STORAGE_KEY = 'angular_auth_user';

  isAuthenticated = signal<boolean>(this.hasStoredUser());
  user = signal<User | null>(this.getStoredUser());

  get authState(): Observable<User | null> {
    return of(this.getStoredUser());
  }

  login(username: string, password: string): Observable<boolean> {
    // Simple authentication check
    if (username === 'admin' && password === 'password') {
      const user: User = { username, isAdmin: true };
      this.setAuth(user);
      return of(true);
    }
    return of(false);
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
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this.isAuthenticated.set(true);
    this.user.set(user);
  }
}
