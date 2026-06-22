import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs';

export interface User {
  username: string;
  isAdmin: boolean;
}

export interface CustomerCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'angular_auth_user';
  private readonly TOKEN_KEY = 'angular_auth_token';

  isAuthenticated = signal<boolean>(this.hasStoredUser());
  user = signal<User | null>(this.getStoredUser());

  get authState(): Observable<User | null> {
    return of(this.getStoredUser());
  }

  login(username: string, password: string): Observable<boolean> {
    // Admin authentication (local, no API call)
    if (username === 'admin' && password === 'password') {
      const user: User = { username, isAdmin: true };
      this.setAuth(user);
      return of(true);
    }

    // Customer authentication via API
    return this.http.post<AuthResponse>('/api/auth/login', { username, password }).pipe(
      map(response => {
        this.saveToken(response.token);
        const user: User = { username: response.username, isAdmin: false };
        this.setAuth(user);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  register(
    username: string,
    password: string,
    email = `${username}@shop.com`
  ): Observable<boolean> {
    if (!username || !password) {
      return of(false);
    }

    // Admin username is reserved
    if (username === 'admin') {
      return of(false);
    }

    const request: RegisterRequest = { username, email, password };

    return this.http.post<AuthResponse>('/api/auth/register', request).pipe(
      map(response => {
        this.saveToken(response.token);
        const user: User = { username: response.username, isAdmin: false };
        this.setAuth(user);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.user.set(null);
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
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

  private saveToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch {
      /* quota exceeded */
    }
  }
}
