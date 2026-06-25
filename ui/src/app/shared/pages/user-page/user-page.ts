import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  ProfileResponse,
  TwoFaSetupResponse,
  TwoFaStatusResponse,
} from '../../../core/auth/services/auth.service';
import { TitleService } from '../../../core/services/title.service';
import { ThemeSelector } from '../../components/theme-selector/theme-selector';

type SettingsTab = 'profile' | 'security' | 'twofa';

@Component({
  selector: 'app-user-page',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatSnackBarModule,
    MatToolbarModule,
    RouterModule,
    ThemeSelector,
  ],
  templateUrl: './user-page.html',
  styleUrls: ['./user-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserPage implements OnInit {
  protected router = inject(Router);
  protected authService = inject(AuthService);
  protected snackBar = inject(MatSnackBar);
  protected titleService = inject(TitleService);

  profile: ProfileResponse | null = null;
  twoFaStatus: TwoFaStatusResponse | null = null;
  twoFaSetup: TwoFaSetupResponse | null = null;
  recoveryCodes: string[] = [];

  loading = false;
  activeTab: SettingsTab = 'profile';

  // Profile edit
  editDisplayName = '';
  editPhoneNumber = '';
  savingProfile = false;

  // Password change
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  changingPassword = false;

  // 2FA
  setupQrCode = '';
  setupVerificationCode = '';
  disableVerificationCode = '';
  resetCodesVerificationCode = '';
  showingSetup = false;
  twoFaLoading = false;

  // Email confirmation
  sendingConfirmation = false;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: profile => {
        this.profile = profile;
        this.editDisplayName = profile.displayName ?? '';
        this.editPhoneNumber = profile.phoneNumber ?? '';
        this.loading = false;
        // Load 2FA status if on that tab
        if (this.activeTab === 'twofa' || this.activeTab === 'security') {
          this.loadTwoFaStatus();
        }
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Failed to load profile', 'Dismiss', { duration: 3000 });
      },
    });
  }

  loadTwoFaStatus() {
    this.authService.getTwoFaStatus().subscribe({
      next: status => {
        this.twoFaStatus = status;
      },
      error: () => {
        this.snackBar.open('Failed to load 2FA status', 'Dismiss', { duration: 3000 });
      },
    });
  }

  saveProfile() {
    this.savingProfile = true;
    this.authService
      .updateProfile({
        displayName: this.editDisplayName || undefined,
        phoneNumber: this.editPhoneNumber || undefined,
      })
      .subscribe({
        next: profile => {
          this.profile = profile;
          this.savingProfile = false;
          this.snackBar.open('Profile updated', 'Dismiss', { duration: 2000 });
        },
        error: () => {
          this.savingProfile = false;
          this.snackBar.open('Failed to update profile', 'Dismiss', { duration: 3000 });
        },
      });
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.snackBar.open('Please fill all fields', 'Dismiss', { duration: 2000 });
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.snackBar.open('New passwords do not match', 'Dismiss', { duration: 2000 });
      return;
    }
    if (this.newPassword.length < 6) {
      this.snackBar.open('Password must be at least 6 characters', 'Dismiss', { duration: 2000 });
      return;
    }

    this.changingPassword = true;
    this.authService
      .changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: () => {
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.changingPassword = false;
          this.snackBar.open('Password changed successfully', 'Dismiss', { duration: 3000 });
        },
        error: () => {
          this.changingPassword = false;
          this.snackBar.open('Failed to change password. Check current password.', 'Dismiss', {
            duration: 4000,
          });
        },
      });
  }

  sendEmailConfirmation() {
    this.sendingConfirmation = true;
    this.authService.sendEmailConfirmation().subscribe({
      next: () => {
        this.sendingConfirmation = false;
        this.snackBar.open('Confirmation email sent', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.sendingConfirmation = false;
        this.snackBar.open('Failed to send confirmation email', 'Dismiss', { duration: 3000 });
      },
    });
  }

  setupTwoFa() {
    this.twoFaLoading = true;
    this.authService.getTwoFaSetup().subscribe({
      next: setup => {
        this.twoFaSetup = setup;
        this.setupQrCode = `data:image/svg+xml;base64,${setup.qrCodeSvgBase64}`;
        this.showingSetup = true;
        this.twoFaLoading = false;
      },
      error: err => {
        this.twoFaLoading = false;
        if (err?.error?.error === '2FA already enabled') {
          this.snackBar.open('2FA is already enabled', 'Dismiss', { duration: 3000 });
        } else {
          this.snackBar.open('Failed to get 2FA setup', 'Dismiss', { duration: 3000 });
        }
      },
    });
  }

  enableTwoFa() {
    if (!this.setupVerificationCode || this.setupVerificationCode.length !== 6) {
      this.snackBar.open('Enter a valid 6-digit code', 'Dismiss', { duration: 2000 });
      return;
    }

    this.twoFaLoading = true;
    this.authService.enableTwoFactor(this.setupVerificationCode).subscribe({
      next: () => {
        this.showingSetup = false;
        this.setupVerificationCode = '';
        this.twoFaLoading = false;
        this.loadTwoFaStatus();
        this.snackBar.open('2FA enabled successfully', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.twoFaLoading = false;
        this.snackBar.open('Invalid verification code', 'Dismiss', { duration: 3000 });
      },
    });
  }

  disableTwoFa() {
    if (!this.disableVerificationCode || this.disableVerificationCode.length !== 6) {
      this.snackBar.open('Enter a valid 6-digit code', 'Dismiss', { duration: 2000 });
      return;
    }

    this.twoFaLoading = true;
    this.authService.disableTwoFactor(this.disableVerificationCode).subscribe({
      next: () => {
        this.disableVerificationCode = '';
        this.twoFaLoading = false;
        this.loadTwoFaStatus();
        this.snackBar.open('2FA disabled', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.twoFaLoading = false;
        this.snackBar.open('Invalid verification code', 'Dismiss', { duration: 3000 });
      },
    });
  }

  getRecoveryCodes() {
    this.authService.getRecoveryCodes().subscribe({
      next: codes => {
        this.recoveryCodes = codes;
      },
      error: () => {
        this.snackBar.open('Failed to get recovery codes', 'Dismiss', { duration: 3000 });
      },
    });
  }

  resetRecoveryCodes() {
    if (!this.resetCodesVerificationCode || this.resetCodesVerificationCode.length !== 6) {
      this.snackBar.open('Enter a valid 6-digit code', 'Dismiss', { duration: 2000 });
      return;
    }

    this.twoFaLoading = true;
    this.authService.resetRecoveryCodes(this.resetCodesVerificationCode).subscribe({
      next: codes => {
        this.recoveryCodes = codes;
        this.resetCodesVerificationCode = '';
        this.twoFaLoading = false;
        this.snackBar.open('Recovery codes reset', 'Dismiss', { duration: 3000 });
      },
      error: () => {
        this.twoFaLoading = false;
        this.snackBar.open('Failed to reset recovery codes', 'Dismiss', { duration: 3000 });
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  switchTab(tab: SettingsTab) {
    this.activeTab = tab;
    if (tab === 'twofa' || tab === 'security') {
      this.loadTwoFaStatus();
    }
  }
}
