import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Dev server nginx reverse proxy requires Basic Auth for all routes.
// These credentials are dev-only and scoped to the dev server hostname.
const DEV_BASIC_AUTH = 'Basic dGVzdGVyOn08NW9UOld6MT9EUiROUmp3fmRq';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor {
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly doc = inject(DOCUMENT, { optional: true });

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (isPlatformBrowser(this.platformId) && this.isDevServer()) {
      // Dev server: send Basic Auth for nginx reverse proxy.
      // If the user also has a JWT token, send it via X-Authorization header so the
      // API can authenticate the user after nginx passes the request.
      const token = this.authService.getToken();
      if (token) {
        req = req.clone({
          setHeaders: {
            Authorization: DEV_BASIC_AUTH,
            'X-Authorization': `Bearer ${token}`,
          },
        });
      } else {
        req = req.clone({
          setHeaders: { Authorization: DEV_BASIC_AUTH },
        });
      }
    } else {
      // Non-dev (local dev, staging, production): JWT auth only
      const token = this.authService.getToken();
      if (token) {
        req = req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        });
      }
    }

    return next.handle(req);
  }

  /**
   * Check if the app is currently running on the dev server.
   * Uses window.location.hostname from the browser environment.
   */
  private isDevServer(): boolean {
    if (this.doc?.location?.hostname) {
      return this.doc.location.hostname.endsWith('statikk.mooo.com');
    }
    return false;
  }
}
