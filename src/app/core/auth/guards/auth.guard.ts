import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private router = inject(Router);

  canActivate(): boolean | UrlTree {
    // In a real app, you would check if the user is authenticated
    // For now, we'll simulate authentication
    const isAuthenticated = this.checkAuth();

    if (isAuthenticated) {
      return true;
    }

    // Redirect to login page if not authenticated
    return this.router.createUrlTree(['/login']);
  }

  private checkAuth(): boolean {
    // This would typically check for a token/session in localStorage/cookies
    // For demo purposes, we'll just return true to allow access
    // In a real application, you'd implement proper authentication logic here
    return true;
  }
}
