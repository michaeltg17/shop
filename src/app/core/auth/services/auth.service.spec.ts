import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

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
    service.login('admin', 'password').subscribe({ next: () => {} });
    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('should persist auth across storage reads', () => {
    service.login('admin', 'password').subscribe({ next: () => {} });
    expect(localStorage.getItem('angular_auth_user')).toBeTruthy();
  });
});
