import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../../core/auth/services/auth.service';
import { TitleService } from '../../../core/services/title.service';
import { ThemeSelector } from '../../components/theme-selector/theme-selector';
import { CartIcon } from '../../components/cart-icon/cart-icon';

export type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatToolbarModule,
    RouterModule,
    ThemeSelector,
    CartIcon,
  ],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  authMode: AuthMode = 'login';
  tabIndex = 0;
  credentials = {
    username: '',
    password: '',
  };

  isLoginLoading = false;
  message: string | null = null;
  messageError = false;

  protected router = inject(Router);
  protected authService = inject(AuthService);
  protected titleService = inject(TitleService);

  ngOnInit() {
    // If already authenticated, redirect based on role
    const user = this.authService.user();
    if (user) {
      if (user.isAdmin) {
        this.router.navigate(['/admin/users']);
      } else {
        this.router.navigate(['/shop/products']);
      }
    }
  }

  onLogin() {
    this.isLoginLoading = true;
    this.message = null;
    this.messageError = false;

    // Simulate API call
    setTimeout(() => {
      this.isLoginLoading = false;

      // Simple validation
      if (!this.credentials.username || !this.credentials.password) {
        this.message = 'Please enter both username and password';
        this.messageError = true;
        return;
      }

      // Authenticate via service
      this.authService
        .login(this.credentials.username, this.credentials.password)
        .subscribe(success => {
          if (success) {
            const user = this.authService.user();
            if (user?.isAdmin) {
              this.router.navigate(['/admin/users']);
            } else {
              this.router.navigate(['/shop/products']);
            }
          } else {
            this.message = 'Invalid username or password';
            this.messageError = true;
          }
        });
    }, 1500);
  }

  onRegister() {
    this.isLoginLoading = true;
    this.message = null;
    this.messageError = false;

    // Simulate API call
    setTimeout(() => {
      this.isLoginLoading = false;

      // Simple validation
      if (!this.credentials.username || !this.credentials.password) {
        this.message = 'Please enter both username and password';
        this.messageError = true;
        return;
      }

      // Register via service
      this.authService
        .register(this.credentials.username, this.credentials.password)
        .subscribe(success => {
          if (success) {
            this.message = 'Registration successful! Redirecting to shop...';
            this.messageError = false;
            setTimeout(() => {
              this.router.navigate(['/shop/products']);
            }, 1000);
          } else {
            this.message = 'Username already taken';
            this.messageError = true;
          }
        });
    }, 1500);
  }

  switchToLogin() {
    this.authMode = 'login';
    this.tabIndex = 0;
    this.message = null;
    this.messageError = false;
    this.credentials = { username: '', password: '' };
  }

  switchToRegister() {
    this.authMode = 'register';
    this.tabIndex = 1;
    this.message = null;
    this.messageError = false;
    this.credentials = { username: '', password: '' };
  }

  onTabChange(index: number) {
    if (index === 0) {
      this.authMode = 'login';
    } else {
      this.authMode = 'register';
    }
    this.message = null;
    this.messageError = false;
    this.credentials = { username: '', password: '' };
  }
}
