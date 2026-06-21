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

  it('should register multiple customers and login with each', () => {
    service.register('user1', 'pass1').subscribe(() => undefined);
    service.logout();
    service.register('user2', 'pass2').subscribe(() => undefined);
    service.logout();

    service.login('user1', 'pass1').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(service.user()?.username).toBe('user1');

    service.logout();
    service.login('user2', 'pass2').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(service.user()?.username).toBe('user2');
  });

  it('should handle localStorage setItem errors during registration gracefully', () => {
    const setItemSpy = jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    service.register('quota-user', 'pass').subscribe(success => {
      expect(success).toBe(true);
    });
    // Auth state should still be set in memory even if localStorage fails
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('quota-user');
    setItemSpy.mockRestore();
  });

  it('should handle localStorage setItem errors during login gracefully', () => {
    const setItemSpy = jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    service.login('admin', 'password').subscribe(success => {
      expect(success).toBe(true);
    });
    // Auth state should still be set in memory even if localStorage fails
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('admin');
    setItemSpy.mockRestore();
  });

  it('should set localStorage correctly during admin login', () => {
    service.login('admin', 'password').subscribe(() => undefined);
    const stored = localStorage.getItem('angular_auth_user');
    expect(stored).toBe(JSON.stringify({ username: 'admin', isAdmin: true }));
  });

  it('should set localStorage correctly during customer registration', () => {
    service.register('testuser', 'testpass').subscribe(() => undefined);
    const stored = localStorage.getItem('angular_auth_user');
    expect(stored).toBe(JSON.stringify({ username: 'testuser', isAdmin: false }));
  });

  it('should save customers to localStorage during registration', () => {
    service.register('testuser', 'testpass').subscribe(() => undefined);
    const stored = localStorage.getItem('angular_customers');
    const customers = JSON.parse(stored!);
    expect(customers).toContainEqual({ username: 'testuser', password: 'testpass' });
  });

  it('should not modify customer list when registration fails due to duplicate', () => {
    service.register('dup', 'pass1').subscribe(() => undefined);
    service.logout();
    const before = localStorage.getItem('angular_customers');
    service.register('dup', 'pass2').subscribe(() => undefined);
    const after = localStorage.getItem('angular_customers');
    expect(before).toBe(after);
  });

  it('should handle logout removing localStorage key', () => {
    service.login('admin', 'password').subscribe(() => undefined);
    service.logout();
    expect(localStorage.getItem('angular_auth_user')).toBeNull();
  });

  it('should initialize isAuthenticated as true when user stored', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    localStorage.setItem('angular_auth_user', JSON.stringify({ username: 'test', isAdmin: false }));
    const fresh = TestBed.inject(AuthService);
    expect(fresh.isAuthenticated()).toBe(true);
  });

  it('should initialize user signal correctly when stored', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    localStorage.setItem(
      'angular_auth_user',
      JSON.stringify({ username: 'stored', isAdmin: true })
    );
    const fresh = TestBed.inject(AuthService);
    expect(fresh.user()?.username).toBe('stored');
    expect(fresh.user()?.isAdmin).toBe(true);
  });

  it('should handle empty password registration', () => {
    service.register('user', ' ').subscribe(success => {
      expect(success).toBe(true);
    });
    expect(service.isAuthenticated()).toBe(true);
  });

  it('should handle login with customer that has empty password', () => {
    service.register('empty-pw', '').subscribe(() => undefined);
    service.logout();
    service.login('empty-pw', '').subscribe(success => {
      expect(success).toBe(true);
    });
  });

  it('should return authState as observable that emits current user', () => {
    service.login('admin', 'password').subscribe(() => undefined);
    service.authState.subscribe(user => {
      expect(user?.username).toBe('admin');
      expect(user?.isAdmin).toBe(true);
    });
  });

  it('should return authState as observable that emits null when not logged in', () => {
    service.authState.subscribe(user => {
      expect(user).toBeNull();
    });
  });
});
