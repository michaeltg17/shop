import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/services/auth.service';

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
  ],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  credentials = {
    username: '',
    password: '',
  };

  isLoginLoading = false;
  loginError: string | null = null;

  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    // If already authenticated, redirect to admin
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin/customers']);
    }
  }

  onLogin() {
    this.isLoginLoading = true;
    this.loginError = null;

    // Simulate API call
    setTimeout(() => {
      this.isLoginLoading = false;

      // Simple validation
      if (!this.credentials.username || !this.credentials.password) {
        this.loginError = 'Please enter both username and password';
        return;
      }

      // Authenticate via service
      if (this.credentials.username === 'admin' && this.credentials.password === 'password') {
        // Set auth state
        this.authService.login(this.credentials.username, this.credentials.password);
        // Navigate to admin dashboard
        this.router.navigate(['/admin/customers']);
      } else {
        this.loginError = 'Invalid username or password';
      }
    }, 1500);
  }
}
