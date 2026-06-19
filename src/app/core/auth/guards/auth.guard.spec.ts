import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthGuard, provideRouter([])],
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true when user is authenticated', () => {
    (authService.isAuthenticated as unknown as { set: (v: boolean) => void }).set(true);
    const result = guard.canActivate();
    expect(result).toBe(true);
  });

  it('should return a UrlTree redirecting to /login when user is not authenticated', () => {
    // Set authenticated signal to false
    (authService.isAuthenticated as unknown as { set: (v: boolean) => void }).set(false);

    // Spy on createUrlTree to verify redirect
    const createUrlTreeSpy = jest.spyOn(router, 'createUrlTree');

    const result = guard.canActivate();

    expect(result).not.toBe(true);
    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/login']);
  });
});
