import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, HttpRequest, HttpEvent } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('AuthInterceptor', () => {
  interface MockHandler {
    handle: (req: HttpRequest<unknown>) => HttpEvent;
  }

  let authService: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthInterceptor,
          useClass: AuthInterceptor,
        },
      ],
    });
    authService = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token is present', () => {
    // Login as a customer via API to get a proper JWT token
    authService.login('customer1', 'pass123').subscribe(() => undefined);
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ token: 'test-jwt-token', username: 'customer1', email: 'customer1@shop.com' });

    const interceptor = TestBed.inject(AuthInterceptor);
    const httpReq = new HttpRequest('GET', '/test', {});
    const nextHandle = jest.fn(() => 'response');

    interceptor.intercept(httpReq, { handle: nextHandle } as MockHandler);

    const clonedReq = nextHandle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.headers.get('Authorization')).toBe('Bearer test-jwt-token');
  });

  it('should NOT add Authorization header when no token', () => {
    // No login, no token
    const interceptor = TestBed.inject(AuthInterceptor);
    const httpReq = new HttpRequest('GET', '/test', {});
    const nextHandle = jest.fn(() => 'response');

    interceptor.intercept(httpReq, { handle: nextHandle } as MockHandler);

    const clonedReq = nextHandle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.headers.get('Authorization')).toBeNull();
  });

  it('should pass request to next handler', () => {
    const interceptor = TestBed.inject(AuthInterceptor);
    const httpReq = new HttpRequest('GET', '/test', {});
    const nextHandle = jest.fn(() => 'mock-response');

    const result = interceptor.intercept(httpReq, { handle: nextHandle } as MockHandler);

    expect(nextHandle).toHaveBeenCalled();
    expect(result).toBe('mock-response');
  });

  it('should handle customer token from API login', () => {
    authService.login('customer1', 'pass123').subscribe(() => undefined);
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ token: 'customer-jwt', username: 'customer1', email: 'customer1@shop.com' });

    const interceptor = TestBed.inject(AuthInterceptor);
    const httpReq = new HttpRequest('GET', '/test', {});
    const nextHandle = jest.fn(() => 'response');

    interceptor.intercept(httpReq, { handle: nextHandle } as MockHandler);

    const clonedReq = nextHandle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.headers.get('Authorization')).toBe('Bearer customer-jwt');
  });

  it('should use the cloned request when adding token', () => {
    authService.login('customer1', 'pass123').subscribe(() => undefined);
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ token: 'test-token', username: 'customer1', email: 'customer1@shop.com' });

    const interceptor = TestBed.inject(AuthInterceptor);
    const httpReq = new HttpRequest('GET', '/original', {});
    const nextHandle = jest.fn(() => 'response');

    interceptor.intercept(httpReq, { handle: nextHandle } as MockHandler);

    const clonedReq = nextHandle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.url).toBe('/original');
    expect(clonedReq.method).toBe('GET');
  });

  it('should handle empty token string', () => {
    localStorage.setItem('angular_auth_token', '');
    // Empty string is falsy in JS, so no header should be added
    const interceptor = TestBed.inject(AuthInterceptor);
    const httpReq = new HttpRequest('GET', '/test', {});
    const nextHandle = jest.fn(() => 'response');

    interceptor.intercept(httpReq, { handle: nextHandle } as MockHandler);

    const clonedReq = nextHandle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.headers.get('Authorization')).toBeNull();
  });

  it('should pass through POST requests with token', () => {
    authService.login('customer1', 'pass123').subscribe(() => undefined);
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ token: 'post-token', username: 'customer1', email: 'customer1@shop.com' });

    const interceptor = TestBed.inject(AuthInterceptor);
    const httpReq = new HttpRequest('POST', '/api/data', { key: 'value' });
    const nextHandle = jest.fn(() => 'response');

    interceptor.intercept(httpReq, { handle: nextHandle } as MockHandler);

    const clonedReq = nextHandle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.method).toBe('POST');
    expect(clonedReq.headers.get('Authorization')).toBe('Bearer post-token');
  });

  it('should not modify request body when adding token', () => {
    authService.login('customer1', 'pass123').subscribe(() => undefined);
    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ token: 'test-token', username: 'customer1', email: 'customer1@shop.com' });

    const interceptor = TestBed.inject(AuthInterceptor);
    const body = { key: 'value', nested: { a: 1 } };
    const httpReq = new HttpRequest('POST', '/api/data', body);
    const nextHandle = jest.fn(() => 'response');

    interceptor.intercept(httpReq, { handle: nextHandle } as MockHandler);

    const clonedReq = nextHandle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.body).toEqual(body);
  });
});
