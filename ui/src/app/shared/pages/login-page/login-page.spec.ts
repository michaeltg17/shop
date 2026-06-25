import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginPage } from './login-page';
import { provideRouter, Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/auth/services/auth.service';
import { TitleService } from '../../../core/services/title.service';
import { ThemeService } from '../../../core/services/theme.service';
import { of, throwError } from 'rxjs';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let router: Router;
  let authServiceSpy: jest.Mocked<Partial<AuthService>>;
  let titleServiceSpy: jest.Mocked<Partial<TitleService>>;

  beforeEach(async () => {
    authServiceSpy = {
      isAuthenticated: jest.fn().mockReturnValue(false),
      user: jest.fn().mockReturnValue(null),
      login: jest.fn().mockReturnValue(of(false)),
      register: jest.fn().mockReturnValue(of(false)),
      sendPasswordResetEmail: jest.fn().mockReturnValue(of(false)),
      verifyTwoFactor: jest.fn().mockReturnValue(of(false)),
      requiresTwoFactor: jest.fn().mockReturnValue(false),
      twoFaSessionId: jest.fn().mockReturnValue(null),
    };
    titleServiceSpy = {
      getTitle: jest.fn().mockReturnValue('Shop'),
    };
    const themeServiceSpy = {
      loadTheme: jest.fn(),
      currentTheme: { mode: 'light', color: 'blue' },
    } as jest.Mocked<Partial<ThemeService>>;

    await TestBed.configureTestingModule({
      imports: [LoginPage, RouterModule],
      providers: [
        provideRouter([
          { path: 'admin/users', redirectTo: '' },
          {
            path: 'shop',
            children: [
              { path: '', redirectTo: '', pathMatch: 'full' },
              { path: 'products', redirectTo: '', pathMatch: 'full' },
            ],
          },
          { path: '', component: LoginPage },
        ]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TitleService, useValue: titleServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with login mode', () => {
    expect(component.authMode).toBe('login');
    expect(component.tabIndex).toBe(0);
  });

  it('should initialize with empty credentials', () => {
    expect(component.credentials.email).toBe('');
    expect(component.credentials.password).toBe('');
  });

  it('should initialize loginStep as credentials', () => {
    expect(component.loginStep).toBe('credentials');
  });

  it('should initialize with no message', () => {
    expect(component.message).toBeNull();
    expect(component.messageError).toBe(false);
  });

  // Redirect tests
  it('should redirect admin to /admin/users when already authenticated', () => {
    authServiceSpy.user!.mockReturnValue({ username: 'admin', isAdmin: true } as User);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
  });

  it('should redirect customer to /shop when already authenticated', () => {
    authServiceSpy.user!.mockReturnValue({ username: 'customer', isAdmin: false } as User);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/shop']);
  });

  it('should not redirect when not authenticated', () => {
    authServiceSpy.user!.mockReturnValue(null);
    component.ngOnInit();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // Login tests
  it('should set message when credentials are missing', fakeAsync(() => {
    component.credentials = { email: '', password: '' };
    component.onLogin();
    tick(1500);
    expect(component.message).toBe('Please enter both email and password');
    expect(component.messageError).toBe(true);
  }));

  it('should set message for wrong credentials', fakeAsync(() => {
    component.credentials = { email: 'wrong@test.com', password: 'wrong' };
    authServiceSpy.login!.mockReturnValue(of(false));
    component.onLogin();
    tick(0);
    expect(component.message).toBe('Invalid email or password');
    expect(component.messageError).toBe(true);
  }));

  it('should navigate to /admin/users on successful admin login', fakeAsync(() => {
    component.credentials = { email: 'admin@test.com', password: 'admin123' };
    authServiceSpy.login!.mockReturnValue(of(true));
    authServiceSpy.user!.mockReturnValue({ username: 'admin', isAdmin: true } as User);
    component.onLogin();
    tick(0);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
  }));

  it('should navigate to /shop on successful customer login', fakeAsync(() => {
    component.credentials = { email: 'customer@test.com', password: 'pass123' };
    authServiceSpy.login!.mockReturnValue(of(true));
    authServiceSpy.user!.mockReturnValue({ username: 'customer', isAdmin: false } as User);
    component.onLogin();
    tick(0);
    expect(router.navigate).toHaveBeenCalledWith(['/shop']);
  }));

  it('should set message when only email is provided', fakeAsync(() => {
    component.credentials = { email: 'admin@test.com', password: '' };
    component.onLogin();
    tick(1500);
    expect(component.message).toBe('Please enter both email and password');
  }));

  it('should set message when only password is provided', fakeAsync(() => {
    component.credentials = { email: '', password: 'admin123' };
    component.onLogin();
    tick(1500);
    expect(component.message).toBe('Please enter both email and password');
  }));

  it('should clear message and set error on failed login attempt', fakeAsync(() => {
    component.message = 'previous error';
    component.credentials = { email: 'admin@test.com', password: 'admin123' };
    authServiceSpy.login!.mockReturnValue(of(false));
    component.onLogin();
    tick(0);
    expect(component.message).toBe('Invalid email or password');
  }));

  it('should set isLoginLoading to false after login completes', fakeAsync(() => {
    component.credentials = { email: 'admin@test.com', password: 'admin123' };
    authServiceSpy.login!.mockReturnValue(of(true));
    authServiceSpy.user!.mockReturnValue({ username: 'admin', isAdmin: true } as User);
    component.onLogin();
    tick(0);
    expect(component.isLoginLoading).toBe(false);
  }));

  // 2FA tests
  it('should show 2FA prompt when login throws TWO_FACTOR_REQUIRED', fakeAsync(() => {
    component.credentials = { email: 'user@test.com', password: 'pass' };
    authServiceSpy.login!.mockReturnValue(throwError(() => new Error('TWO_FACTOR_REQUIRED')));
    component.onLogin();
    tick(0);
    expect(component.loginStep).toBe('2fa');
    expect(component.message).toBeNull();
  }));

  it('should show generic error on non-2FA login error', fakeAsync(() => {
    component.credentials = { email: 'user@test.com', password: 'pass' };
    authServiceSpy.login!.mockReturnValue(throwError(() => new Error('Network error')));
    component.onLogin();
    tick(0);
    expect(component.message).toBe('Invalid email or password');
    expect(component.messageError).toBe(true);
  }));

  it('should verify 2FA successfully and navigate to /shop', fakeAsync(() => {
    component.twoFaCode = '123456';
    authServiceSpy.verifyTwoFactor!.mockReturnValue(of(true));
    authServiceSpy.user!.mockReturnValue({ username: 'user', isAdmin: false } as User);
    component.onVerify2fa();
    tick(0);
    expect(router.navigate).toHaveBeenCalledWith(['/shop']);
    expect(component.isLoginLoading).toBe(false);
  }));

  it('should verify 2FA successfully and navigate to /admin/users for admin', fakeAsync(() => {
    component.twoFaCode = '123456';
    authServiceSpy.verifyTwoFactor!.mockReturnValue(of(true));
    authServiceSpy.user!.mockReturnValue({ username: 'admin', isAdmin: true } as User);
    component.onVerify2fa();
    tick(0);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
  }));

  it('should show error for invalid 2FA code', fakeAsync(() => {
    component.twoFaCode = '123';
    component.onVerify2fa();
    tick(0);
    expect(component.message).toBe('Please enter a valid 6-digit code');
    expect(component.messageError).toBe(true);
  }));

  it('should show error for empty 2FA code', fakeAsync(() => {
    component.twoFaCode = '';
    component.onVerify2fa();
    tick(0);
    expect(component.message).toBe('Please enter a valid 6-digit code');
    expect(component.messageError).toBe(true);
  }));

  it('should show error for failed 2FA verification', fakeAsync(() => {
    component.twoFaCode = '123456';
    authServiceSpy.verifyTwoFactor!.mockReturnValue(of(false));
    component.onVerify2fa();
    tick(0);
    expect(component.message).toBe('Invalid verification code. Please try again.');
    expect(component.messageError).toBe(true);
  }));

  // Password reset tests
  it('should show error when reset email is empty', () => {
    component.resetEmail = '';
    component.onForgotPassword();
    expect(component.message).toBe('Please enter your email address');
    expect(component.messageError).toBe(true);
  });

  it('should send password reset email successfully', fakeAsync(() => {
    component.resetEmail = 'user@test.com';
    authServiceSpy.sendPasswordResetEmail!.mockReturnValue(of(true));
    component.onForgotPassword();
    tick(0);
    expect(component.isResetSent).toBe(true);
    expect(component.message).toBe(
      'If an account with that email exists, a password reset link has been sent.'
    );
    expect(component.messageError).toBe(false);
  }));

  it('should show error when password reset email fails', fakeAsync(() => {
    component.resetEmail = 'user@test.com';
    authServiceSpy.sendPasswordResetEmail!.mockReturnValue(of(false));
    component.onForgotPassword();
    tick(0);
    expect(component.message).toBe('Failed to send reset email. Please try again.');
    expect(component.messageError).toBe(true);
  }));

  // Registration tests
  it('should set message when register credentials are missing', fakeAsync(() => {
    component.credentials = { email: '', password: '' };
    component.onRegister();
    tick(1500);
    expect(component.message).toBe('Please enter both email and password');
    expect(component.messageError).toBe(true);
  }));

  it('should set message for invalid email format', fakeAsync(() => {
    component.credentials = { email: 'not-an-email', password: 'pass123' };
    component.onRegister();
    tick(0);
    expect(component.message).toBe('Please enter a valid email address');
    expect(component.messageError).toBe(true);
  }));

  it('should set message for email without @ symbol', fakeAsync(() => {
    component.credentials = { email: 'noatsign.com', password: 'pass123' };
    component.onRegister();
    tick(0);
    expect(component.message).toBe('Please enter a valid email address');
  }));

  it('should set message for email without dot in domain', fakeAsync(() => {
    component.credentials = { email: 'user@domain', password: 'pass123' };
    component.onRegister();
    tick(0);
    expect(component.message).toBe('Please enter a valid email address');
  }));

  it('should set message when username already taken', fakeAsync(() => {
    component.credentials = { email: 'taken@test.com', password: 'pass123' };
    authServiceSpy.register!.mockReturnValue(of(false));
    component.onRegister();
    tick(0);
    expect(component.message).toBe('Email already registered or invalid data');
    expect(component.messageError).toBe(true);
  }));

  it('should show success message and navigate on successful registration', fakeAsync(() => {
    component.credentials = { email: 'newuser@test.com', password: 'pass123' };
    authServiceSpy.register!.mockReturnValue(of(true));
    component.onRegister();
    tick(0);
    expect(component.message).toBe('Registration successful! Check your email for verification.');
    expect(component.messageError).toBe(false);
    tick(2000); // Wait for redirect timeout
    expect(router.navigate).toHaveBeenCalledWith(['/shop']);
  }));

  it('should clear message and set error on failed register attempt', fakeAsync(() => {
    component.message = 'previous error';
    component.credentials = { email: 'newuser@test.com', password: 'pass123' };
    authServiceSpy.register!.mockReturnValue(of(false));
    component.onRegister();
    tick(0);
    expect(component.message).toBe('Email already registered or invalid data');
  }));

  // Tab switching tests
  it('should switch to login mode', () => {
    component.authMode = 'register';
    component.tabIndex = 1;
    component.message = 'some message';
    component.messageError = true;
    component.credentials = { email: 'test', password: 'test' };
    component.loginStep = '2fa';
    component.twoFaCode = '123456';
    component.isResetSent = true;
    component.switchToLogin();
    expect(component.authMode).toBe('login');
    expect(component.tabIndex).toBe(0);
    expect(component.message).toBeNull();
    expect(component.messageError).toBe(false);
    expect(component.credentials.email).toBe('');
    expect(component.credentials.password).toBe('');
    expect(component.loginStep).toBe('credentials');
    expect(component.twoFaCode).toBe('');
    expect(component.isResetSent).toBe(false);
  });

  it('should switch to register mode', () => {
    component.authMode = 'login';
    component.tabIndex = 0;
    component.message = 'some message';
    component.messageError = true;
    component.credentials = { email: 'test', password: 'test' };
    component.loginStep = 'password-reset';
    component.twoFaCode = '123456';
    component.isResetSent = true;
    component.switchToRegister();
    expect(component.authMode).toBe('register');
    expect(component.tabIndex).toBe(1);
    expect(component.message).toBeNull();
    expect(component.messageError).toBe(false);
    expect(component.credentials.email).toBe('');
    expect(component.credentials.password).toBe('');
    expect(component.loginStep).toBe('credentials');
    expect(component.twoFaCode).toBe('');
    expect(component.isResetSent).toBe(false);
  });

  it('should handle tab change to login', () => {
    component.onTabChange(0);
    expect(component.authMode).toBe('login');
    expect(component.message).toBeNull();
    expect(component.messageError).toBe(false);
    expect(component.credentials.email).toBe('');
    expect(component.loginStep).toBe('credentials');
    expect(component.twoFaCode).toBe('');
    expect(component.isResetSent).toBe(false);
  });

  it('should handle tab change to register', () => {
    component.onTabChange(1);
    expect(component.authMode).toBe('register');
    expect(component.message).toBeNull();
    expect(component.messageError).toBe(false);
    expect(component.credentials.email).toBe('');
    expect(component.loginStep).toBe('credentials');
  });

  // Navigation helper tests
  it('should go back to credentials from 2FA', () => {
    component.loginStep = '2fa';
    component.message = 'enter code';
    component.messageError = true;
    component.twoFaCode = '123456';
    component.backToCredentials();
    expect(component.loginStep).toBe('credentials');
    expect(component.message).toBeNull();
    expect(component.messageError).toBe(false);
    expect(component.twoFaCode).toBe('');
  });

  it('should show forgot password screen', () => {
    component.loginStep = 'credentials';
    component.message = 'some message';
    component.messageError = true;
    component.showForgotPassword();
    expect(component.loginStep).toBe('password-reset');
    expect(component.message).toBeNull();
    expect(component.messageError).toBe(false);
  });

  it('should go back from password reset to credentials', () => {
    component.loginStep = 'password-reset';
    component.message = 'reset sent';
    component.messageError = true;
    component.isResetSent = true;
    component.resetEmail = 'user@test.com';
    component.backFromReset();
    expect(component.loginStep).toBe('credentials');
    expect(component.message).toBeNull();
    expect(component.messageError).toBe(false);
    expect(component.isResetSent).toBe(false);
    expect(component.resetEmail).toBe('');
  });

  // Navbar tests
  it('should have titleService for navbar', () => {
    expect(component.titleService).toBeTruthy();
  });

  it('should have authService for navbar auth state', () => {
    expect(component.authService).toBeTruthy();
  });

  // State defaults
  it('should initialize resetEmail as empty string', () => {
    expect(component.resetEmail).toBe('');
  });

  it('should initialize isResetSent as false', () => {
    expect(component.isResetSent).toBe(false);
  });

  it('should initialize twoFaCode as empty string', () => {
    expect(component.twoFaCode).toBe('');
  });
});
