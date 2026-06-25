import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs';

export interface User {
  username: string;
  isAdmin: boolean;
  id?: string;
  email?: string;
  emailConfirmed?: boolean;
  isTwoFactorEnabled?: boolean;
}

export interface CustomerCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
}

export interface TwoFactorLoginResponse {
  requiresTwoFactor: boolean;
  token?: string;
  email?: string;
  twoFaSessionId?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface ProfileResponse {
  id: string;
  email: string;
  phoneNumber?: string;
  displayName?: string;
  isEmailConfirmed: boolean;
  isTwoFactorEnabled: boolean;
  roles: string[];
}

export interface TwoFaStatusResponse {
  isTwoFaEnabled: boolean;
  isEmailConfirmed: boolean;
  hasRecoveryCodes: boolean;
}

export interface TwoFaSetupResponse {
  provisioningUri: string;
  secretBase32: string;
  qrCodeSvgBase64: string;
}

export interface ProfileUpdateRequest {
  email?: string;
  phoneNumber?: string;
  displayName?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  resetToken: string;
  newPassword: string;
}

export interface TwoFaEnableRequest {
  verificationCode: string;
}

export interface TwoFaDisableRequest {
  verificationCode: string;
}

export interface TwoFaLoginRequest {
  twoFaSessionId: string;
  twoFaCode: string;
  rememberLogin?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'angular_auth_user';
  private readonly TOKEN_KEY = 'angular_auth_token';

  // Signals
  isAuthenticated = signal<boolean>(this.hasStoredUser());
  user = signal<User | null>(this.getStoredUser());

  // 2FA login state
  requiresTwoFactor = signal<boolean>(false);
  twoFaSessionId = signal<string | null>(null);

  get authState(): Observable<User | null> {
    return of(this.getStoredUser());
  }

  // ========== Login (with 2FA support) ==========

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<TwoFactorLoginResponse>('/api/auth/login', { email, password }).pipe(
      map(response => {
        if (response.requiresTwoFactor && response.twoFaSessionId) {
          // 2FA required — store session and notify UI
          this.requiresTwoFactor.set(true);
          this.twoFaSessionId.set(response.twoFaSessionId);
          throw new Error('TWO_FACTOR_REQUIRED');
        }

        // Direct login — save token, then fetch profile
        if (response.token && response.email) {
          this.saveToken(response.token);
          throw new Error('LOGIN_SUCCESS_FETCH_PROFILE');
        }
        return false;
      }),
      catchError(err => {
        if (err.message === 'TWO_FACTOR_REQUIRED') {
          throw err; // Re-throw for UI handling
        }
        if (err.message === 'LOGIN_SUCCESS_FETCH_PROFILE') {
          // Fetch profile to get roles and full user info
          return this.getProfile().pipe(
            map(profile => {
              const isAdmin = profile.roles.includes('Admin');
              const user: User = {
                username: profile.displayName ?? profile.email,
                email: profile.email,
                id: profile.id,
                isAdmin,
                emailConfirmed: profile.isEmailConfirmed,
                isTwoFactorEnabled: profile.isTwoFactorEnabled,
              };
              this.setAuth(user);
              return true;
            }),
            catchError(() => {
              // Profile fetch failed — fall back to minimal user from token
              const fallback: User = {
                username: email,
                email: email,
                isAdmin: false,
              };
              this.setAuth(fallback);
              return of(true);
            })
          );
        }
        return of(false);
      })
    );
  }

  // ========== 2FA Verification ==========

  verifyTwoFactor(twoFaCode: string): Observable<boolean> {
    const sessionId = this.twoFaSessionId();
    if (!sessionId) {
      return of(false);
    }

    return this.http
      .post<AuthResponse>('/api/auth/2fa/verify', {
        twoFaSessionId: sessionId,
        twoFaCode,
      })
      .pipe(
        switchMap(response => {
          this.saveToken(response.token);
          // Fetch profile to get roles
          return this.getProfile().pipe(
            map(profile => {
              const isAdmin = profile.roles.includes('Admin');
              const user: User = {
                username: profile.displayName ?? profile.email,
                email: profile.email,
                id: profile.id,
                isAdmin,
                emailConfirmed: profile.isEmailConfirmed,
                isTwoFactorEnabled: profile.isTwoFactorEnabled,
              };
              this.setAuth(user);
              this.requiresTwoFactor.set(false);
              this.twoFaSessionId.set(null);
              return true;
            }),
            catchError(() => {
              // Fallback
              const user: User = {
                username: response.email,
                email: response.email,
                isAdmin: false,
              };
              this.setAuth(user);
              this.requiresTwoFactor.set(false);
              this.twoFaSessionId.set(null);
              return of(true);
            })
          );
        })
      );
  }

  // ========== Registration ==========

  register(email: string, password: string): Observable<boolean> {
    if (!email || !password) {
      return of(false);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return of(false);
    }

    const request: RegisterRequest = { email, password };

    return this.http.post<AuthResponse>('/api/auth/register', request).pipe(
      switchMap(response => {
        this.saveToken(response.token);
        // Fetch profile
        return this.getProfile().pipe(
          map(profile => {
            const isAdmin = profile.roles.includes('Admin');
            const user: User = {
              username: profile.displayName ?? profile.email,
              email: profile.email,
              id: profile.id,
              isAdmin,
              emailConfirmed: profile.isEmailConfirmed,
              isTwoFactorEnabled: profile.isTwoFactorEnabled,
            };
            this.setAuth(user);
            return true;
          }),
          catchError(() => {
            const user: User = {
              username: email,
              email: email,
              isAdmin: false,
            };
            this.setAuth(user);
            return of(true);
          })
        );
      }),
      catchError(() => of(false))
    );
  }

  // ========== Logout ==========

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.user.set(null);
    this.requiresTwoFactor.set(false);
    this.twoFaSessionId.set(null);
  }

  // ========== Token Management ==========

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    const user = this.user();
    if (user?.id) return user.id;

    // Try to extract userId from JWT (NameIdentifier claim)
    const token = this.getToken();
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        const nid = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
        if (nid) {
          if (user) {
            this.setAuth({ ...user, id: nid });
          }
          return nid;
        }
      }
    } catch {
      // If decoding fails, return null
    }
    return null;
  }

  isEmailConfirmed(): boolean {
    const user = this.user();
    if (user?.emailConfirmed !== undefined) return user.emailConfirmed;

    const token = this.getToken();
    if (!token) return true; // Default to true if no token
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return payload['email_confirmed'] !== 'false';
      }
    } catch {
      /* ignore */
    }
    return true;
  }

  // ========== Profile ==========

  getProfile(): Observable<ProfileResponse> {
    return this.http.get<ProfileResponse>('/api/auth/profile');
  }

  updateProfile(request: ProfileUpdateRequest): Observable<ProfileResponse> {
    return this.http.put<ProfileResponse>('/api/auth/profile', request).pipe(
      map(profile => {
        const isAdmin = profile.roles.includes('Admin');
        const user: User = {
          username: profile.displayName ?? profile.email,
          email: profile.email,
          id: profile.id,
          isAdmin,
          emailConfirmed: profile.isEmailConfirmed,
          isTwoFactorEnabled: profile.isTwoFactorEnabled,
        };
        this.setAuth(user);
        return profile;
      })
    );
  }

  changePassword(request: PasswordChangeRequest): Observable<boolean> {
    return this.http.post<{ message: string }>('/api/auth/password/change', request).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // ========== Email Confirmation ==========

  sendEmailConfirmation(): Observable<boolean> {
    return this.http.post<{ message: string }>('/api/auth/email/confirm/send', {}).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  confirmEmail(userId: string, email: string, code: string): Observable<boolean> {
    const params = new URLSearchParams({ userId, email, code });
    return this.http.get<{ message: string }>(`/api/auth/email/confirm?${params}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // ========== 2FA Management ==========

  getTwoFaStatus(): Observable<TwoFaStatusResponse> {
    return this.http.get<TwoFaStatusResponse>('/api/auth/2fa/status');
  }

  getTwoFaSetup(): Observable<TwoFaSetupResponse> {
    return this.http.get<TwoFaSetupResponse>('/api/auth/2fa/setup');
  }

  enableTwoFactor(verificationCode: string): Observable<boolean> {
    return this.http
      .post<{ message: string }>('/api/auth/2fa/enable', {
        verificationCode,
      })
      .pipe(
        map(() => {
          const currentUser = this.user();
          if (currentUser) {
            this.setAuth({ ...currentUser, isTwoFactorEnabled: true });
          }
          return true;
        }),
        catchError(() => of(false))
      );
  }

  disableTwoFactor(verificationCode: string): Observable<boolean> {
    return this.http
      .post<{ message: string }>('/api/auth/2fa/disable', {
        verificationCode,
      })
      .pipe(
        map(() => {
          const currentUser = this.user();
          if (currentUser) {
            this.setAuth({ ...currentUser, isTwoFactorEnabled: false });
          }
          return true;
        }),
        catchError(() => of(false))
      );
  }

  getRecoveryCodes(): Observable<string[]> {
    return this.http.get<{ codes: string[] }>('/api/auth/2fa/recovery-codes').pipe(
      map(response => response.codes),
      catchError(() => of([]))
    );
  }

  resetRecoveryCodes(verificationCode: string): Observable<string[]> {
    return this.http
      .post<{ codes: string[] }>('/api/auth/2fa/recovery-codes/reset', {
        verificationCode,
      })
      .pipe(
        map(response => response.codes),
        catchError(() => of([]))
      );
  }

  // ========== Password Reset ==========

  sendPasswordResetEmail(email: string): Observable<boolean> {
    return this.http.post<{ message: string }>('/api/auth/password/reset/send', { email }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  resetPassword(email: string, resetToken: string, newPassword: string): Observable<boolean> {
    return this.http
      .post<{ message: string }>('/api/auth/password/reset', {
        email,
        resetToken,
        newPassword,
      })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  // ========== Storage Helpers ==========

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
