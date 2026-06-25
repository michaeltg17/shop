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
export type LoginStep = 'credentials' | '2fa' | 'password-reset';

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
    email: '',
    password: '',
  };

  isLoginLoading = false;
  message: string | null = null;
  messageError = false;

  // 2FA flow
  loginStep: LoginStep = 'credentials';
  twoFaCode = '';

  // Password reset
  resetEmail = '';
  isResetSent = false;

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
        this.router.navigate(['/shop']);
      }
    }
  }

  onLogin() {
    this.isLoginLoading = true;
    this.message = null;
    this.messageError = false;

    if (!this.credentials.email || !this.credentials.password) {
      this.isLoginLoading = false;
      this.message = 'Please enter both email and password';
      this.messageError = true;
      return;
    }

    this.authService.login(this.credentials.email, this.credentials.password).subscribe({
      next: success => {
        this.isLoginLoading = false;
        if (success) {
          const user = this.authService.user();
          if (user?.isAdmin) {
            this.router.navigate(['/admin/users']);
          } else {
            this.router.navigate(['/shop']);
          }
        } else {
          this.message = 'Invalid email or password';
          this.messageError = true;
        }
      },
      error: err => {
        this.isLoginLoading = false;
        if (err.message === 'TWO_FACTOR_REQUIRED') {
          this.loginStep = '2fa';
          this.message = null;
        } else {
          this.message = 'Invalid email or password';
          this.messageError = true;
        }
      },
    });
  }

  onVerify2fa() {
    this.isLoginLoading = true;
    this.message = null;
    this.messageError = false;

    if (!this.twoFaCode || this.twoFaCode.length !== 6) {
      this.isLoginLoading = false;
      this.message = 'Please enter a valid 6-digit code';
      this.messageError = true;
      return;
    }

    this.authService.verifyTwoFactor(this.twoFaCode).subscribe(success => {
      this.isLoginLoading = false;
      if (success) {
        const user = this.authService.user();
        if (user?.isAdmin) {
          this.router.navigate(['/admin/users']);
        } else {
          this.router.navigate(['/shop']);
        }
      } else {
        this.message = 'Invalid verification code. Please try again.';
        this.messageError = true;
      }
    });
  }

  onForgotPassword() {
    if (!this.resetEmail) {
      this.message = 'Please enter your email address';
      this.messageError = true;
      return;
    }

    this.isLoginLoading = true;
    this.message = null;
    this.messageError = false;

    this.authService.sendPasswordResetEmail(this.resetEmail).subscribe(success => {
      this.isLoginLoading = false;
      if (success) {
        this.isResetSent = true;
        this.message = 'If an account with that email exists, a password reset link has been sent.';
        this.messageError = false;
      } else {
        this.message = 'Failed to send reset email. Please try again.';
        this.messageError = true;
      }
    });
  }

  onRegister() {
    this.isLoginLoading = true;
    this.message = null;
    this.messageError = false;

    if (!this.credentials.email || !this.credentials.password) {
      this.isLoginLoading = false;
      this.message = 'Please enter both email and password';
      this.messageError = true;
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.credentials.email)) {
      this.isLoginLoading = false;
      this.message = 'Please enter a valid email address';
      this.messageError = true;
      return;
    }

    this.authService
      .register(this.credentials.email, this.credentials.password)
      .subscribe(success => {
        this.isLoginLoading = false;
        if (success) {
          this.message = 'Registration successful! Check your email for verification.';
          this.messageError = false;
          setTimeout(() => {
            this.router.navigate(['/shop']);
          }, 2000);
        } else {
          this.message = 'Email already registered or invalid data';
          this.messageError = true;
        }
      });
  }

  switchToLogin() {
    this.authMode = 'login';
    this.tabIndex = 0;
    this.message = null;
    this.messageError = false;
    this.credentials = { email: '', password: '' };
    this.loginStep = 'credentials';
    this.twoFaCode = '';
    this.isResetSent = false;
  }

  switchToRegister() {
    this.authMode = 'register';
    this.tabIndex = 1;
    this.message = null;
    this.messageError = false;
    this.credentials = { email: '', password: '' };
    this.loginStep = 'credentials';
    this.twoFaCode = '';
    this.isResetSent = false;
  }

  onTabChange(index: number) {
    if (index === 0) {
      this.authMode = 'login';
    } else {
      this.authMode = 'register';
    }
    this.message = null;
    this.messageError = false;
    this.credentials = { email: '', password: '' };
    this.loginStep = 'credentials';
    this.twoFaCode = '';
    this.isResetSent = false;
  }

  backToCredentials() {
    this.loginStep = 'credentials';
    this.message = null;
    this.messageError = false;
    this.twoFaCode = '';
  }

  showForgotPassword() {
    this.loginStep = 'password-reset';
    this.message = null;
    this.messageError = false;
  }

  backFromReset() {
    this.loginStep = 'credentials';
    this.message = null;
    this.messageError = false;
    this.isResetSent = false;
    this.resetEmail = '';
  }
}
