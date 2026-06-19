import { TestBed } from '@angular/core/testing';
import { AuthService, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false for isAuthenticated when no user is stored', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return null for user when no user is stored', () => {
    expect(service.user()).toBeNull();
  });

  it('should login with valid credentials', () => {
    service.login('admin', 'password').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('admin');
    expect(service.user()?.isAdmin).toBe(true);
  });

  it('should return false for invalid credentials', () => {
    service.login('wrong', 'wrong').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should clear auth state on logout', () => {
    service.login('admin', 'password').subscribe(() => undefined);
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('should persist auth across storage reads', () => {
    service.login('admin', 'password').subscribe(() => undefined);
    expect(localStorage.getItem('angular_auth_user')).toBeTruthy();
  });

  it('should return Observable<User | null> from authState', () => {
    service.login('admin', 'password').subscribe(() => undefined);
    let emitted: User | null = null;
    service.authState.subscribe(user => {
      emitted = user;
    });
    expect(emitted?.username).toBe('admin');
  });

  it('should handle localStorage errors gracefully in hasStoredUser', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn(() => {
      throw new Error('QuotaExceededError');
    });
    const service2 = TestBed.inject(AuthService);
    expect(service2.isAuthenticated()).toBe(false);
    localStorage.getItem = originalGetItem;
  });

  it('should handle localStorage errors gracefully in getStoredUser', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn(() => {
      throw new Error('QuotaExceededError');
    });
    const service2 = TestBed.inject(AuthService);
    expect(service2.user()).toBeNull();
    localStorage.getItem = originalGetItem;
  });
});
