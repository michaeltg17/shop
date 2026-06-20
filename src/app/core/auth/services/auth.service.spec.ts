import { TestBed } from '@angular/core/testing';
import { AuthService, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
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

  it('should login with valid admin credentials', () => {
    service.login('admin', 'password').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('admin');
    expect(service.user()?.isAdmin).toBe(true);
  });

  it('should return false for invalid admin credentials', () => {
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

  // Customer registration tests
  it('should register a new customer', () => {
    service.register('customer1', 'pass123').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('customer1');
    expect(service.user()?.isAdmin).toBe(false);
  });

  it('should return false when registering with empty username', () => {
    service.register('', 'pass123').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return false when registering with empty password', () => {
    service.register('customer1', '').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return false when registering username "admin"', () => {
    service.register('admin', 'pass123').subscribe(success => {
      expect(success).toBe(false);
    });
  });

  it('should return false when registering duplicate username', () => {
    service.register('customer1', 'pass123').subscribe(() => undefined);
    service.logout();
    service.register('customer1', 'different').subscribe(success => {
      expect(success).toBe(false);
    });
  });

  // Customer login tests
  it('should login a registered customer', () => {
    // Register first
    service.register('customer1', 'pass123').subscribe(() => undefined);
    service.logout();

    // Then login
    service.login('customer1', 'pass123').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('customer1');
    expect(service.user()?.isAdmin).toBe(false);
  });

  it('should return false for unregistered customer login', () => {
    service.login('nonexistent', 'pass123').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return false for wrong password on registered customer', () => {
    service.register('customer1', 'pass123').subscribe(() => undefined);
    service.logout();

    service.login('customer1', 'wrongpass').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should auto-login after registration', () => {
    service.register('customer1', 'pass123').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('customer1');
  });

  it('should persist customers across storage reads', () => {
    service.register('customer1', 'pass123').subscribe(() => undefined);
    service.logout();

    // Create a new service instance to simulate fresh load
    const newService = TestBed.inject(AuthService);
    newService.login('customer1', 'pass123').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(newService.isAuthenticated()).toBe(true);
  });

  it('should handle localStorage errors gracefully when getting customers', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn(() => {
      throw new Error('QuotaExceededError');
    });
    const service2 = TestBed.inject(AuthService);
    service2.login('someuser', 'somepass').subscribe(success => {
      expect(success).toBe(false);
    });
    localStorage.getItem = originalGetItem;
  });

  it('should return false for admin login with wrong password', () => {
    service.login('admin', 'wrongpass').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return false for admin login with wrong username', () => {
    service.login('wrongadmin', 'password').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return false for empty credentials', () => {
    service.login('', '').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should handle malformed JSON in localStorage for customers', () => {
    localStorage.setItem('angular_customers', 'not-json');
    const service2 = TestBed.inject(AuthService);
    service2.login('test', 'test').subscribe(success => {
      expect(success).toBe(false);
    });
  });

  it('should handle malformed JSON in localStorage for auth', () => {
    localStorage.setItem('angular_auth_user', 'not-json');
    const service2 = TestBed.inject(AuthService);
    expect(service2.user()).toBeNull();
  });

  it('should handle malformed JSON in localStorage for customers', () => {
    localStorage.setItem('angular_customers', 'not-json');
    const service2 = TestBed.inject(AuthService);
    // should not crash, customers should be empty
    service2.register('malformed-test', 'test123').subscribe(success => {
      expect(success).toBe(false); // registration fails because localStorage throws on get
    });
  });

  it('should login a registered customer after logout and re-login', () => {
    service.register('relogin', 'pw').subscribe(() => undefined);
    service.logout();
    service.login('relogin', 'pw').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(service.user()?.username).toBe('relogin');
    expect(service.user()?.isAdmin).toBe(false);
  });

  it('should return false when trying to login a registered customer with wrong password', () => {
    service.register('pw-check', 'correct').subscribe(() => undefined);
    service.logout();
    service.login('pw-check', 'wrong').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should set auth correctly after admin login and clear on logout', () => {
    service.login('admin', 'password').subscribe(() => undefined);
    expect(service.user()?.isAdmin).toBe(true);
    service.logout();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('angular_auth_user')).toBeNull();
  });

  it('should set auth correctly after customer registration and clear on logout', () => {
    service.register('logout-test', 'pw').subscribe(() => undefined);
    expect(service.user()?.isAdmin).toBe(false);
    service.logout();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });
});
