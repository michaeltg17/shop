import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginPage } from './login-page';
import { provideRouter, Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../../core/auth/services/auth.service';
import { TitleService } from '../../../core/services/title.service';
import { ThemeService } from '../../../core/services/theme.service';
import { of } from 'rxjs';

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
          { path: 'shop/products', redirectTo: '' },
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
    expect(component.credentials.username).toBe('');
    expect(component.credentials.password).toBe('');
  });

  // Redirect tests
  it('should redirect admin to /admin/users when already authenticated', () => {
    authServiceSpy.user!.mockReturnValue({ username: 'admin', isAdmin: true } as User);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
  });

  it('should redirect customer to /shop/products when already authenticated', () => {
    authServiceSpy.user!.mockReturnValue({ username: 'customer1', isAdmin: false } as User);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/shop/products']);
  });

  it('should not redirect when not authenticated', () => {
    authServiceSpy.user!.mockReturnValue(null);
    component.ngOnInit();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // Login tests
  it('should set message when credentials are missing', fakeAsync(() => {
    component.credentials = { username: '', password: '' };
    component.onLogin();
    tick(1500);
    expect(component.message).toBe('Please enter both username and password');
    expect(component.messageError).toBe(true);
  }));

  it('should set message for wrong credentials', fakeAsync(() => {
    component.credentials = { username: 'wrong', password: 'wrong' };
    authServiceSpy.login!.mockReturnValue(of(false));
    component.onLogin();
    tick(1500);
    expect(component.message).toBe('Invalid username or password');
    expect(component.messageError).toBe(true);
  }));

  it('should navigate to /admin/users on successful admin login', fakeAsync(() => {
    component.credentials = { username: 'admin', password: 'admin123' };
    authServiceSpy.login!.mockReturnValue(of(true));
    authServiceSpy.user!.mockReturnValue({ username: 'admin', isAdmin: true } as User);
    component.onLogin();
    tick(1500);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/users']);
  }));

  it('should navigate to /shop/products on successful customer login', fakeAsync(() => {
    component.credentials = { username: 'customer1', password: 'pass123' };
    authServiceSpy.login!.mockReturnValue(of(true));
    authServiceSpy.user!.mockReturnValue({ username: 'customer1', isAdmin: false } as User);
    component.onLogin();
    tick(1500);
    expect(router.navigate).toHaveBeenCalledWith(['/shop/products']);
  }));

  it('should set message when only username is provided', fakeAsync(() => {
    component.credentials = { username: 'admin', password: '' };
    component.onLogin();
    tick(1500);
    expect(component.message).toBe('Please enter both username and password');
  }));

  it('should set message when only password is provided', fakeAsync(() => {
    component.credentials = { username: '', password: 'admin123' };
    component.onLogin();
    tick(1500);
    expect(component.message).toBe('Please enter both username and password');
  }));

  it('should clear message before login attempt', fakeAsync(() => {
    component.message = 'previous error';
    component.credentials = { username: 'admin', password: 'admin123' };
    component.onLogin();
    expect(component.message).toBeNull();
    tick(1500);
  }));

  it('should set isLoginLoading to true then false', fakeAsync(() => {
    expect(component.isLoginLoading).toBe(false);
    component.onLogin();
    expect(component.isLoginLoading).toBe(true);
    tick(1500);
    expect(component.isLoginLoading).toBe(false);
  }));

  // Registration tests
  it('should set message when register credentials are missing', fakeAsync(() => {
    component.credentials = { username: '', password: '' };
    component.onRegister();
    tick(1500);
    expect(component.message).toBe('Please enter both username and password');
    expect(component.messageError).toBe(true);
  }));

  it('should set message when username already taken', fakeAsync(() => {
    component.credentials = { username: 'customer1', password: 'pass123' };
    authServiceSpy.register!.mockReturnValue(of(false));
    component.onRegister();
    tick(1500);
    expect(component.message).toBe('Username already taken');
    expect(component.messageError).toBe(true);
  }));

  it('should show success message and navigate on successful registration', fakeAsync(() => {
    component.credentials = { username: 'newuser', password: 'pass123' };
    authServiceSpy.register!.mockReturnValue(of(true));
    component.onRegister();
    tick(1500);
    expect(component.message).toBe('Registration successful! Redirecting to shop...');
    expect(component.messageError).toBe(false);
    tick(1000); // Wait for redirect timeout
    expect(router.navigate).toHaveBeenCalledWith(['/shop/products']);
  }));

  it('should clear message before register attempt', fakeAsync(() => {
    component.message = 'previous error';
    component.credentials = { username: 'newuser', password: 'pass123' };
    component.onRegister();
    expect(component.message).toBeNull();
    tick(1500);
  }));

  // Tab switching tests
  it('should switch to login mode', () => {
    component.authMode = 'register';
    component.tabIndex = 1;
    component.message = 'some message';
    component.credentials = { username: 'test', password: 'test' };
    component.switchToLogin();
    expect(component.authMode).toBe('login');
    expect(component.tabIndex).toBe(0);
    expect(component.message).toBeNull();
    expect(component.credentials.username).toBe('');
    expect(component.credentials.password).toBe('');
  });

  it('should switch to register mode', () => {
    component.authMode = 'login';
    component.tabIndex = 0;
    component.message = 'some message';
    component.credentials = { username: 'test', password: 'test' };
    component.switchToRegister();
    expect(component.authMode).toBe('register');
    expect(component.tabIndex).toBe(1);
    expect(component.message).toBeNull();
    expect(component.credentials.username).toBe('');
    expect(component.credentials.password).toBe('');
  });

  it('should handle tab change to login', () => {
    component.onTabChange(0);
    expect(component.authMode).toBe('login');
    expect(component.message).toBeNull();
    expect(component.credentials.username).toBe('');
  });

  it('should handle tab change to register', () => {
    component.onTabChange(1);
    expect(component.authMode).toBe('register');
    expect(component.message).toBeNull();
    expect(component.credentials.username).toBe('');
  });

  // Navbar tests
  it('should have titleService for navbar', () => {
    expect(component.titleService).toBeTruthy();
  });

  it('should have authService for navbar auth state', () => {
    expect(component.authService).toBeTruthy();
  });
});
