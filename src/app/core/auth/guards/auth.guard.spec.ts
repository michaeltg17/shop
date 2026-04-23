import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthGuard, provideRouter([])],
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true when user is authenticated', () => {
    const result = guard.canActivate();
    expect(result).toBe(true);
  });

  it('should return a UrlTree redirecting to /login when user is not authenticated', () => {
    // Spy on createUrlTree to verify redirect
    const createUrlTreeSpy = jest.spyOn(router, 'createUrlTree');

    // Spy on checkAuth to simulate unauthenticated user
    jest
      .spyOn(guard as unknown as { checkAuth: () => boolean }, 'checkAuth')
      .mockReturnValue(false);

    const result = guard.canActivate();

    expect(result).not.toBe(true);
    expect(createUrlTreeSpy).toHaveBeenCalledWith(['/login']);
  });
});
