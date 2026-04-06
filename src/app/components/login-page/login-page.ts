import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.scss']
})
export class LoginPage implements OnInit {
  credentials = {
    username: '',
    password: ''
  };

  isLoginLoading = false;
  loginError: string | null = null;

  private router = inject(Router);

  ngOnInit() {
    // Check if user is already logged in
    this.checkAuthentication();
  }

  checkAuthentication() {
    // In a real app, you would check if the user is already authenticated
    // For now, we'll just let them see the login page
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

      // Simple authentication check (in a real app, this would be an API call)
      if (this.credentials.username === 'admin' && this.credentials.password === 'password') {
        // Successful login - navigate to dashboard
        this.router.navigate(['/customers']);
      } else {
        this.loginError = 'Invalid username or password';
      }
    }, 1500);
  }
}