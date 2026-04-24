import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginPage } from './login-page';
import { Router } from '@angular/router';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let routerSpy: { navigate: jest.Mock };

  beforeEach(async () => {
    routerSpy = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [{ provide: Router, useValue: routerSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty credentials', () => {
    expect(component.credentials.username).toBe('');
    expect(component.credentials.password).toBe('');
  });

  it('should call checkAuthentication on init', () => {
    const spy = jest.spyOn(component, 'checkAuthentication');
    component.ngOnInit();
    expect(spy).toHaveBeenCalled();
  });

  it('should set loginError when credentials are missing', fakeAsync(() => {
    component.credentials = { username: '', password: '' };
    component.onLogin();
    tick(1500);
    expect(component.loginError).toBe('Please enter both username and password');
  }));

  it('should set loginError for wrong credentials', fakeAsync(() => {
    component.credentials = { username: 'wrong', password: 'wrong' };
    component.onLogin();
    tick(1500);
    expect(component.loginError).toBe('Invalid username or password');
  }));

  it('should navigate to /customers on successful login', fakeAsync(() => {
    component.credentials = { username: 'admin', password: 'password' };
    component.onLogin();
    tick(1500);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/customers']);
  }));

  it('should set loginError when username correct but password wrong', fakeAsync(() => {
    component.credentials = { username: 'admin', password: 'wrong' };
    component.onLogin();
    tick(1500);
    expect(component.loginError).toBe('Invalid username or password');
  }));

  it('should set loginError when password correct but username wrong', fakeAsync(() => {
    component.credentials = { username: 'wrong', password: 'password' };
    component.onLogin();
    tick(1500);
    expect(component.loginError).toBe('Invalid username or password');
  }));

  it('should set loginError when only username is provided', fakeAsync(() => {
    component.credentials = { username: 'admin', password: '' };
    component.onLogin();
    tick(1500);
    expect(component.loginError).toBe('Please enter both username and password');
  }));

  it('should set loginError when only password is provided', fakeAsync(() => {
    component.credentials = { username: '', password: 'password' };
    component.onLogin();
    tick(1500);
    expect(component.loginError).toBe('Please enter both username and password');
  }));

  it('should clear loginError before login attempt', fakeAsync(() => {
    component.loginError = 'previous error';
    component.credentials = { username: 'admin', password: 'password' };
    component.onLogin();
    expect(component.loginError).toBeNull();
    tick(1500);
  }));

  it('should set isLoginLoading to true then false', fakeAsync(() => {
    expect(component.isLoginLoading).toBe(false);
    component.onLogin();
    expect(component.isLoginLoading).toBe(true);
    tick(1500);
    expect(component.isLoginLoading).toBe(false);
  }));
});
