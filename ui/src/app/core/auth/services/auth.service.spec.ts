import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService, ProfileResponse, TwoFaStatusResponse, User } from './auth.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
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

  // --- Login tests (API-based) ---

  it('should login with valid credentials', fakeAsync(() => {
    service.login('admin@test.com', 'password').subscribe(success => {
      expect(success).toBe(true);
    });

    // Flush login response (direct login, no 2FA)
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'fake-jwt', email: 'admin@test.com' });

    // Flush profile response
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'user-1',
      email: 'admin@test.com',
      displayName: 'Admin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Admin'],
    });

    tick();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('Admin');
    expect(service.user()?.isAdmin).toBe(true);
  }));

  it('should return false for invalid credentials (401)', fakeAsync(() => {
    service.login('wrong@test.com', 'wrong').subscribe(success => {
      expect(success).toBe(false);
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ error: 'invalid' }, { status: 401, statusText: 'Unauthorized' });

    tick();
    expect(service.isAuthenticated()).toBe(false);
  }));

  it('should clear auth state on logout', fakeAsync(() => {
    service.login('admin@test.com', 'password').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'fake-jwt', email: 'admin@test.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'user-1',
      email: 'admin@test.com',
      displayName: 'Admin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Admin'],
    });
    tick();

    service.logout();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
  }));

  it('should persist auth across storage reads', fakeAsync(() => {
    service.login('test@test.com', 'pass').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'test@test.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u1',
      email: 'test@test.com',
      displayName: 'Test',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();

    expect(localStorage.getItem('angular_auth_user')).toBeTruthy();
  }));

  it('should return Observable<User | null> from authState', fakeAsync(() => {
    service.login('admin@test.com', 'password').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'admin@test.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u1',
      email: 'admin@test.com',
      displayName: 'Admin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Admin'],
    });
    tick();

    let emitted: User | null = null;
    service.authState.subscribe(user => {
      emitted = user;
    });
    expect(emitted?.username).toBe('Admin');
  }));

  it('should handle localStorage errors gracefully in hasStoredUser', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => {
      throw new Error('QuotaExceededError');
    };
    const service2 = TestBed.inject(AuthService);
    expect(service2.isAuthenticated()).toBe(false);
    localStorage.getItem = originalGetItem;
  });

  it('should handle localStorage errors gracefully in getStoredUser', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = () => {
      throw new Error('QuotaExceededError');
    };
    const service2 = TestBed.inject(AuthService);
    expect(service2.user()).toBeNull();
    localStorage.getItem = originalGetItem;
  });

  // --- Registration tests (API-based, email format) ---

  it('should register a new customer', fakeAsync(() => {
    service.register('newuser@shop.com', 'pass123').subscribe(success => {
      expect(success).toBe(true);
    });

    const req = httpMock.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'fake-jwt', email: 'newuser@shop.com' });

    // Profile fetch follows
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u2',
      email: 'newuser@shop.com',
      displayName: 'NewUser',
      isEmailConfirmed: false,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });

    tick();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.isAdmin).toBe(false);
  }));

  it('should return false when registering with empty email', () => {
    service.register('', 'pass123').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return false when registering with empty password', () => {
    service.register('test@test.com', '').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return false when registering with invalid email format', () => {
    service.register('not-an-email', 'pass123').subscribe(success => {
      expect(success).toBe(false);
    });
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return false for wrong password login', fakeAsync(() => {
    service.login('user@test.com', 'wrongpass').subscribe(success => {
      expect(success).toBe(false);
    });
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ error: 'wrong password' }, { status: 401, statusText: 'Unauthorized' });
    tick();
    expect(service.isAuthenticated()).toBe(false);
  }));

  it('should auto-login after registration', fakeAsync(() => {
    service.register('auto@shop.com', 'pass123').subscribe(success => {
      expect(success).toBe(true);
    });
    const req = httpMock.expectOne('/api/auth/register');
    req.flush({ token: 'jwt', email: 'auto@shop.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u3',
      email: 'auto@shop.com',
      displayName: 'Auto',
      isEmailConfirmed: false,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('Auto');
  }));

  it('should handle 409 duplicate on registration gracefully', fakeAsync(() => {
    service.login('dup@shop.com', 'pass').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'dup@shop.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u4',
      email: 'dup@shop.com',
      displayName: 'Dup',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();
    service.logout();

    // Register again (simulating duplicate via 409)
    service.register('dup@shop.com', 'pass2').subscribe(success => {
      expect(success).toBe(false);
    });
    const regReq = httpMock.expectOne('/api/auth/register');
    regReq.flush({ error: 'duplicate' }, { status: 409, statusText: 'Conflict' });
    tick();
  }));

  it('should handle login after logout and re-login', fakeAsync(() => {
    // First login
    service.login('relogin@shop.com', 'pw').subscribe(() => undefined);
    const loginReq1 = httpMock.expectOne('/api/auth/login');
    loginReq1.flush({ requiresTwoFactor: false, token: 'jwt', email: 'relogin@shop.com' });
    const profileReq1 = httpMock.expectOne('/api/auth/profile');
    profileReq1.flush({
      id: 'u5',
      email: 'relogin@shop.com',
      displayName: 'Relogin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();
    service.logout();

    // Re-login
    service.login('relogin@shop.com', 'pw').subscribe(success => {
      expect(success).toBe(true);
    });
    const loginReq2 = httpMock.expectOne('/api/auth/login');
    loginReq2.flush({ requiresTwoFactor: false, token: 'jwt2', email: 'relogin@shop.com' });
    const profileReq2 = httpMock.expectOne('/api/auth/profile');
    profileReq2.flush({
      id: 'u5',
      email: 'relogin@shop.com',
      displayName: 'Relogin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();
    expect(service.user()?.username).toBe('Relogin');
  }));

  it('should set auth correctly after admin login and clear on logout', fakeAsync(() => {
    service.login('admin@test.com', 'password').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'admin@test.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u1',
      email: 'admin@test.com',
      displayName: 'Admin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Admin'],
    });
    tick();

    expect(service.user()?.isAdmin).toBe(true);
    service.logout();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('angular_auth_user')).toBeNull();
  }));

  it('should register multiple customers and login with each', fakeAsync(() => {
    // Register user1
    service.register('user1@shop.com', 'pass1').subscribe(() => undefined);
    const reg1 = httpMock.expectOne('/api/auth/register');
    reg1.flush({ token: 'jwt1', email: 'user1@shop.com' });
    const prof1 = httpMock.expectOne('/api/auth/profile');
    prof1.flush({
      id: 'u1',
      email: 'user1@shop.com',
      displayName: 'User1',
      isEmailConfirmed: false,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();
    service.logout();

    // Register user2
    service.register('user2@shop.com', 'pass2').subscribe(() => undefined);
    const reg2 = httpMock.expectOne('/api/auth/register');
    reg2.flush({ token: 'jwt2', email: 'user2@shop.com' });
    const prof2 = httpMock.expectOne('/api/auth/profile');
    prof2.flush({
      id: 'u2',
      email: 'user2@shop.com',
      displayName: 'User2',
      isEmailConfirmed: false,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();
    service.logout();

    // Login as user1
    service.login('user1@shop.com', 'pass1').subscribe(success => {
      expect(success).toBe(true);
    });
    const login1 = httpMock.expectOne('/api/auth/login');
    login1.flush({ requiresTwoFactor: false, token: 'jwt3', email: 'user1@shop.com' });
    const prof3 = httpMock.expectOne('/api/auth/profile');
    prof3.flush({
      id: 'u1',
      email: 'user1@shop.com',
      displayName: 'User1',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();
    expect(service.user()?.username).toBe('User1');

    service.logout();

    // Login as user2
    service.login('user2@shop.com', 'pass2').subscribe(success => {
      expect(success).toBe(true);
    });
    const login2 = httpMock.expectOne('/api/auth/login');
    login2.flush({ requiresTwoFactor: false, token: 'jwt4', email: 'user2@shop.com' });
    const prof4 = httpMock.expectOne('/api/auth/profile');
    prof4.flush({
      id: 'u2',
      email: 'user2@shop.com',
      displayName: 'User2',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();
    expect(service.user()?.username).toBe('User2');
  }));

  it('should handle localStorage setItem errors during registration gracefully', fakeAsync(() => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    service.register('quota@shop.com', 'pass').subscribe(success => {
      expect(success).toBe(true);
    });
    const req = httpMock.expectOne('/api/auth/register');
    req.flush({ token: 'jwt', email: 'quota@shop.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u6',
      email: 'quota@shop.com',
      displayName: 'Quota',
      isEmailConfirmed: false,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();

    // Auth state should still be set in memory even if localStorage fails
    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('Quota');
    localStorage.setItem = originalSetItem;
  }));

  it('should handle localStorage setItem errors during login gracefully', fakeAsync(() => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    service.login('admin@test.com', 'password').subscribe(success => {
      expect(success).toBe(true);
    });
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'admin@test.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u1',
      email: 'admin@test.com',
      displayName: 'Admin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Admin'],
    });
    tick();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.user()?.username).toBe('Admin');
    localStorage.setItem = originalSetItem;
  }));

  it('should set localStorage correctly during admin login', fakeAsync(() => {
    service.login('admin@test.com', 'password').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'admin@test.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u1',
      email: 'admin@test.com',
      displayName: 'Admin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Admin'],
    });
    tick();

    const stored = localStorage.getItem('angular_auth_user');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.username).toBe('Admin');
    expect(parsed.isAdmin).toBe(true);
  }));

  it('should handle logout removing localStorage key', fakeAsync(() => {
    service.login('admin@test.com', 'password').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'admin@test.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u1',
      email: 'admin@test.com',
      displayName: 'Admin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Admin'],
    });
    tick();
    service.logout();
    expect(localStorage.getItem('angular_auth_user')).toBeNull();
  }));

  it('should initialize isAuthenticated as true when user stored', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    localStorage.setItem('angular_auth_user', JSON.stringify({ username: 'test', isAdmin: false }));
    const fresh = TestBed.inject(AuthService);
    expect(fresh.isAuthenticated()).toBe(true);
  });

  it('should initialize user signal correctly when stored', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    localStorage.setItem(
      'angular_auth_user',
      JSON.stringify({ username: 'stored', isAdmin: true })
    );
    const fresh = TestBed.inject(AuthService);
    expect(fresh.user()?.username).toBe('stored');
    expect(fresh.user()?.isAdmin).toBe(true);
  });

  it('should handle malformed JSON in localStorage for auth', () => {
    localStorage.setItem('angular_auth_user', 'not-json');
    const service2 = TestBed.inject(AuthService);
    expect(service2.user()).toBeNull();
  });

  it('should handle empty password registration', fakeAsync(() => {
    service.register('user@shop.com', ' ').subscribe(success => {
      expect(success).toBe(true);
    });
    const req = httpMock.expectOne('/api/auth/register');
    req.flush({ token: 'jwt', email: 'user@shop.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u7',
      email: 'user@shop.com',
      displayName: 'User',
      isEmailConfirmed: false,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();
    expect(service.isAuthenticated()).toBe(true);
  }));

  it('should return authState as observable that emits current user', fakeAsync(() => {
    service.login('admin@test.com', 'password').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'admin@test.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u1',
      email: 'admin@test.com',
      displayName: 'Admin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Admin'],
    });
    tick();
    service.authState.subscribe(user => {
      expect(user?.username).toBe('Admin');
      expect(user?.isAdmin).toBe(true);
    });
  }));

  it('should return authState as observable that emits null when not logged in', () => {
    service.authState.subscribe(user => {
      expect(user).toBeNull();
    });
  });

  // --- 2FA tests ---

  it('should trigger 2FA flow when login requires it', fakeAsync(() => {
    service.login('user@shop.com', 'pass').subscribe({
      next: () => {
        // Should not reach here on 2FA
        fail('should not emit success');
      },
      error: err => {
        expect(err.message).toBe('TWO_FACTOR_REQUIRED');
        expect(service.requiresTwoFactor()).toBe(true);
        expect(service.twoFaSessionId()).toBe('session-123');
      },
    });

    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({
      requiresTwoFactor: true,
      twoFaSessionId: 'session-123',
    });
    tick();
  }));

  it('should verify 2FA code and complete login', fakeAsync(() => {
    // Setup 2FA state
    service.requiresTwoFactor.set(true);
    service.twoFaSessionId.set('session-123');

    service.verifyTwoFactor('123456').subscribe(success => {
      expect(success).toBe(true);
    });

    const verifyReq = httpMock.expectOne('/api/auth/2fa/verify');
    verifyReq.flush({ token: 'jwt-final', email: 'user@shop.com' });

    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u8',
      email: 'user@shop.com',
      displayName: 'User',
      isEmailConfirmed: true,
      isTwoFactorEnabled: true,
      roles: ['Customer'],
    });

    tick();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.requiresTwoFactor()).toBe(false);
    expect(service.twoFaSessionId()).toBeNull();
  }));

  // --- Profile / Password / 2FA management ---

  it('should fetch profile', fakeAsync(() => {
    // Setup auth
    localStorage.setItem('angular_auth_token', 'jwt');

    let profile: ProfileResponse | null = null;
    service.getProfile().subscribe(p => {
      profile = p;
    });

    const req = httpMock.expectOne('/api/auth/profile');
    req.flush({
      id: 'u1',
      email: 'admin@test.com',
      displayName: 'Admin',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Admin'],
    });
    tick();
    expect(profile?.displayName).toBe('Admin');
  }));

  it('should change password', fakeAsync(() => {
    service.changePassword({ currentPassword: 'old', newPassword: 'new' }).subscribe(success => {
      expect(success).toBe(true);
    });
    const req = httpMock.expectOne('/api/auth/password/change');
    req.flush({ message: 'ok' });
    tick();
  }));

  it('should send email confirmation', fakeAsync(() => {
    service.sendEmailConfirmation().subscribe(success => {
      expect(success).toBe(true);
    });
    const req = httpMock.expectOne('/api/auth/email/confirm/send');
    req.flush({ message: 'sent' });
    tick();
  }));

  it('should get 2FA status', fakeAsync(() => {
    let status: TwoFaStatusResponse | null = null;
    service.getTwoFaStatus().subscribe(s => {
      status = s;
    });
    const req = httpMock.expectOne('/api/auth/2fa/status');
    req.flush({ isTwoFaEnabled: false, isEmailConfirmed: true, hasRecoveryCodes: false });
    tick();
    expect(status?.isTwoFaEnabled).toBe(false);
  }));

  it('should enable 2FA', fakeAsync(() => {
    // Setup user via login flow
    service.login('user@shop.com', 'pass').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'user@shop.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u8',
      email: 'user@shop.com',
      displayName: 'User',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });
    tick();

    service.enableTwoFactor('654321').subscribe(success => {
      expect(success).toBe(true);
    });
    const req = httpMock.expectOne('/api/auth/2fa/enable');
    req.flush({ message: 'enabled' });
    tick();
    expect(service.user()?.isTwoFactorEnabled).toBe(true);
  }));

  it('should disable 2FA', fakeAsync(() => {
    // Setup user via login flow with 2FA enabled
    service.login('user2@shop.com', 'pass').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'jwt', email: 'user2@shop.com' });
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u9',
      email: 'user2@shop.com',
      displayName: 'User2',
      isEmailConfirmed: true,
      isTwoFactorEnabled: true,
      roles: ['Customer'],
    });
    tick();

    service.disableTwoFactor('654321').subscribe(success => {
      expect(success).toBe(true);
    });
    const req = httpMock.expectOne('/api/auth/2fa/disable');
    req.flush({ message: 'disabled' });
    tick();
    expect(service.user()?.isTwoFactorEnabled).toBe(false);
  }));

  it('should get recovery codes', fakeAsync(() => {
    let codes: string[] = [];
    service.getRecoveryCodes().subscribe(c => {
      codes = c;
    });
    const req = httpMock.expectOne('/api/auth/2fa/recovery-codes');
    req.flush({ codes: ['code1', 'code2', 'code3'] });
    tick();
    expect(codes.length).toBe(3);
  }));

  it('should send password reset email', fakeAsync(() => {
    service.sendPasswordResetEmail('user@shop.com').subscribe(success => {
      expect(success).toBe(true);
    });
    const req = httpMock.expectOne('/api/auth/password/reset/send');
    req.flush({ message: 'sent' });
    tick();
  }));

  it('should reset password', fakeAsync(() => {
    service.resetPassword('user@shop.com', 'token123', 'newpass').subscribe(success => {
      expect(success).toBe(true);
    });
    const req = httpMock.expectOne('/api/auth/password/reset');
    req.flush({ message: 'reset' });
    tick();
  }));

  // --- Token helpers ---

  it('should getToken return null when not stored', () => {
    expect(service.getToken()).toBeNull();
  });

  it('should save and retrieve token', () => {
    // Use private saveToken via login flow
    service.login('test@test.com', 'pass').subscribe(() => undefined);
    const loginReq = httpMock.expectOne('/api/auth/login');
    loginReq.flush({ requiresTwoFactor: false, token: 'my-token', email: 'test@test.com' });
    // Profile fetch follows - flush it
    const profileReq = httpMock.expectOne('/api/auth/profile');
    profileReq.flush({
      id: 'u9',
      email: 'test@test.com',
      displayName: 'Test',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    });

    expect(localStorage.getItem('angular_auth_token')).toBe('my-token');
  });
});
