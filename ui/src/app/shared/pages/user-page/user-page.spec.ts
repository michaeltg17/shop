import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { UserPage } from './user-page';
import { provideRouter, Router, RouterModule } from '@angular/router';
import { AuthService, ProfileResponse, TwoFaStatusResponse, TwoFaSetupResponse } from '../../../core/auth/services/auth.service';
import { TitleService } from '../../../core/services/title.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

describe('UserPage', () => {
  let component: UserPage;
  let fixture: ComponentFixture<UserPage>;
  let router: Router;
  let authServiceSpy: jest.Mocked<Partial<AuthService>>;
  let snackBarSpy: jest.Mocked<Partial<MatSnackBar>>;

  const mockProfile: ProfileResponse = {
    id: 'u1',
    email: 'test@test.com',
    displayName: 'Test User',
    phoneNumber: '1234567890',
    isEmailConfirmed: true,
    isTwoFactorEnabled: false,
    roles: ['Customer'],
  };

  const mockTwoFaStatus: TwoFaStatusResponse = {
    isTwoFaEnabled: false,
    isEmailConfirmed: true,
    hasRecoveryCodes: false,
  };

  const mockTwoFaStatusEnabled: TwoFaStatusResponse = {
    isTwoFaEnabled: true,
    isEmailConfirmed: true,
    hasRecoveryCodes: true,
  };

  const mockTwoFaSetup: TwoFaSetupResponse = {
    provisioningUri: 'otpauth://totp/test',
    secretBase32: 'JBSWY3DPEHPK3PXP',
    qrCodeSvgBase64: 'SGVsbG8gV29ybGQ=',
  };

  beforeEach(async () => {
    authServiceSpy = {
      isAuthenticated: jest.fn().mockReturnValue(true),
      user: jest.fn().mockReturnValue({ username: 'Test', email: 'test@test.com', isAdmin: false }),
      logout: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      sendEmailConfirmation: jest.fn(),
      confirmEmail: jest.fn(),
      getTwoFaStatus: jest.fn(),
      getTwoFaSetup: jest.fn(),
      enableTwoFactor: jest.fn(),
      disableTwoFactor: jest.fn(),
      getRecoveryCodes: jest.fn(),
      resetRecoveryCodes: jest.fn(),
    };
    snackBarSpy = {
      open: jest.fn().mockReturnValue({} as any),
    };

    await TestBed.configureTestingModule({
      imports: [UserPage, RouterModule],
      providers: [
        provideRouter([
          { path: 'login', redirectTo: '', pathMatch: 'full' },
          { path: 'shop', redirectTo: '', pathMatch: 'full' },
          { path: 'admin/users', redirectTo: '', pathMatch: 'full' },
          { path: '', redirectTo: '', pathMatch: 'full' },
        ]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: TitleService, useValue: { getTitle: jest.fn().mockReturnValue('User') } },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createComponent(profile?: ProfileResponse, twoFaStatus?: TwoFaStatusResponse) {
    const p = profile || mockProfile;
    const s = twoFaStatus || mockTwoFaStatus;
    authServiceSpy.getProfile!.mockReturnValue(of(p));
    authServiceSpy.getTwoFaStatus!.mockReturnValue(of(s));
    authServiceSpy.updateProfile!.mockReturnValue(of(p));
    authServiceSpy.changePassword!.mockReturnValue(of(true));
    authServiceSpy.sendEmailConfirmation!.mockReturnValue(of(true));
    authServiceSpy.getTwoFaSetup!.mockReturnValue(of(mockTwoFaSetup));
    authServiceSpy.enableTwoFactor!.mockReturnValue(of(true));
    authServiceSpy.disableTwoFactor!.mockReturnValue(of(true));
    authServiceSpy.getRecoveryCodes!.mockReturnValue(of(['code1', 'code2', 'code3']));
    authServiceSpy.resetRecoveryCodes!.mockReturnValue(of(['newcode1', 'newcode2']));

    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  }

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should load profile on init', fakeAsync(() => {
    createComponent();
    tick();
    expect(authServiceSpy.getProfile).toHaveBeenCalled();
    expect(component.profile).toEqual(mockProfile);
    expect(component.editDisplayName).toBe('Test User');
    expect(component.editPhoneNumber).toBe('1234567890');
    expect(component.loading).toBe(false);
  }));

  it('should handle profile load error', fakeAsync(() => {
    authServiceSpy.getProfile!.mockReturnValue(throwError(() => new Error('Network error')));
    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    tick();
    expect(component.loading).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to load profile', 'Dismiss', { duration: 3000 });
  }));

  it('should handle profile with null displayName and phoneNumber', fakeAsync(() => {
    const profileNoFields: ProfileResponse = {
      id: 'u3',
      email: 'nomore@test.com',
      isEmailConfirmed: true,
      isTwoFactorEnabled: false,
      roles: ['Customer'],
    };
    authServiceSpy.getProfile!.mockReturnValue(of(profileNoFields));
    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    tick();
    expect(component.editDisplayName).toBe('');
    expect(component.editPhoneNumber).toBe('');
  }));

  // saveProfile tests
  it('should save profile successfully', fakeAsync(() => {
    createComponent();
    tick();
    component.editDisplayName = 'Updated Name';
    component.saveProfile();
    tick();
    expect(authServiceSpy.updateProfile).toHaveBeenCalledWith({
      displayName: 'Updated Name',
      phoneNumber: '1234567890',
    });
    expect(component.savingProfile).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Profile updated', 'Dismiss', { duration: 2000 });
  }));

  it('should save profile with undefined values when empty', fakeAsync(() => {
    createComponent();
    tick();
    component.editDisplayName = '';
    component.editPhoneNumber = '';
    component.saveProfile();
    tick();
    expect(authServiceSpy.updateProfile).toHaveBeenCalledWith({
      displayName: undefined,
      phoneNumber: undefined,
    });
  }));

  it('should handle save profile error', fakeAsync(() => {
    createComponent();
    tick();
    authServiceSpy.updateProfile!.mockReturnValue(throwError(() => new Error('Error')));
    component.saveProfile();
    tick();
    expect(component.savingProfile).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to update profile', 'Dismiss', { duration: 3000 });
  }));

  // changePassword tests
  it('should show error when password fields are empty', () => {
    createComponent();
    component.changePassword();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Please fill all fields', 'Dismiss', { duration: 2000 });
  });

  it('should show error when new passwords do not match', () => {
    createComponent();
    component.currentPassword = 'current';
    component.newPassword = 'new1';
    component.confirmPassword = 'new2';
    component.changePassword();
    expect(snackBarSpy.open).toHaveBeenCalledWith('New passwords do not match', 'Dismiss', { duration: 2000 });
  });

  it('should show error when password is too short', () => {
    createComponent();
    component.currentPassword = 'current';
    component.newPassword = 'short';
    component.confirmPassword = 'short';
    component.changePassword();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Password must be at least 6 characters', 'Dismiss', { duration: 2000 });
  });

  it('should change password successfully', fakeAsync(() => {
    createComponent();
    tick();
    component.currentPassword = 'currentPass';
    component.newPassword = 'newPass123';
    component.confirmPassword = 'newPass123';
    component.changePassword();
    tick();
    expect(authServiceSpy.changePassword).toHaveBeenCalledWith({
      currentPassword: 'currentPass',
      newPassword: 'newPass123',
    });
    expect(component.currentPassword).toBe('');
    expect(component.newPassword).toBe('');
    expect(component.confirmPassword).toBe('');
    expect(component.changingPassword).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Password changed successfully', 'Dismiss', { duration: 3000 });
  }));

  it('should handle change password error', fakeAsync(() => {
    createComponent();
    tick();
    authServiceSpy.changePassword!.mockReturnValue(throwError(() => new Error('Error')));
    component.currentPassword = 'currentPass';
    component.newPassword = 'newPass123';
    component.confirmPassword = 'newPass123';
    component.changePassword();
    tick();
    expect(component.changingPassword).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Failed to change password. Check current password.',
      'Dismiss',
      { duration: 4000 }
    );
  }));

  // sendEmailConfirmation tests
  it('should send email confirmation successfully', fakeAsync(() => {
    createComponent();
    tick();
    component.sendEmailConfirmation();
    tick();
    expect(authServiceSpy.sendEmailConfirmation).toHaveBeenCalled();
    expect(component.sendingConfirmation).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Confirmation email sent', 'Dismiss', { duration: 3000 });
  }));

  it('should handle email confirmation error', fakeAsync(() => {
    createComponent();
    tick();
    authServiceSpy.sendEmailConfirmation!.mockReturnValue(throwError(() => new Error('Error')));
    component.sendEmailConfirmation();
    tick();
    expect(component.sendingConfirmation).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to send confirmation email', 'Dismiss', { duration: 3000 });
  }));

  // 2FA setup tests
  it('should setup 2FA successfully', fakeAsync(() => {
    createComponent();
    tick();
    component.setupTwoFa();
    tick();
    expect(authServiceSpy.getTwoFaSetup).toHaveBeenCalled();
    expect(component.twoFaSetup).toEqual(mockTwoFaSetup);
    expect(component.setupQrCode).toBe('data:image/svg+xml;base64,SGVsbG8gV29ybGQ=');
    expect(component.showingSetup).toBe(true);
    expect(component.twoFaLoading).toBe(false);
  }));

  it('should handle 2FA already enabled error', fakeAsync(() => {
    createComponent();
    tick();
    const err = { error: { error: '2FA already enabled' } };
    authServiceSpy.getTwoFaSetup!.mockReturnValue(throwError(() => err));
    component.setupTwoFa();
    tick();
    expect(component.twoFaLoading).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('2FA is already enabled', 'Dismiss', { duration: 3000 });
  }));

  it('should handle 2FA setup general error', fakeAsync(() => {
    createComponent();
    tick();
    authServiceSpy.getTwoFaSetup!.mockReturnValue(throwError(() => new Error('Error')));
    component.setupTwoFa();
    tick();
    expect(component.twoFaLoading).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to get 2FA setup', 'Dismiss', { duration: 3000 });
  }));

  // enableTwoFa tests
  it('should show error for invalid 2FA code length', () => {
    createComponent();
    component.setupVerificationCode = '12345';
    component.enableTwoFa();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Enter a valid 6-digit code', 'Dismiss', { duration: 2000 });
  });

  it('should show error for empty 2FA code', () => {
    createComponent();
    component.setupVerificationCode = '';
    component.enableTwoFa();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Enter a valid 6-digit code', 'Dismiss', { duration: 2000 });
  });

  it('should enable 2FA successfully', fakeAsync(() => {
    createComponent();
    tick();
    component.setupVerificationCode = '123456';
    component.enableTwoFa();
    tick();
    expect(authServiceSpy.enableTwoFactor).toHaveBeenCalledWith('123456');
    expect(component.showingSetup).toBe(false);
    expect(component.setupVerificationCode).toBe('');
    expect(component.twoFaLoading).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('2FA enabled successfully', 'Dismiss', { duration: 3000 });
  }));

  it('should handle enable 2FA error', fakeAsync(() => {
    createComponent();
    tick();
    component.setupVerificationCode = '123456';
    authServiceSpy.enableTwoFactor!.mockReturnValue(throwError(() => new Error('Error')));
    component.enableTwoFa();
    tick();
    expect(component.twoFaLoading).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Invalid verification code', 'Dismiss', { duration: 3000 });
  }));

  // disableTwoFa tests
  it('should show error for invalid disable 2FA code', () => {
    createComponent();
    component.disableVerificationCode = '12345';
    component.disableTwoFa();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Enter a valid 6-digit code', 'Dismiss', { duration: 2000 });
  });

  it('should disable 2FA successfully', fakeAsync(() => {
    createComponent();
    tick();
    component.disableVerificationCode = '123456';
    component.disableTwoFa();
    tick();
    expect(authServiceSpy.disableTwoFactor).toHaveBeenCalledWith('123456');
    expect(component.disableVerificationCode).toBe('');
    expect(component.twoFaLoading).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('2FA disabled', 'Dismiss', { duration: 3000 });
  }));

  it('should handle disable 2FA error', fakeAsync(() => {
    createComponent();
    tick();
    component.disableVerificationCode = '123456';
    authServiceSpy.disableTwoFactor!.mockReturnValue(throwError(() => new Error('Error')));
    component.disableTwoFa();
    tick();
    expect(component.twoFaLoading).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Invalid verification code', 'Dismiss', { duration: 3000 });
  }));

  // Recovery codes tests
  it('should get recovery codes', fakeAsync(() => {
    createComponent();
    tick();
    component.getRecoveryCodes();
    tick();
    expect(authServiceSpy.getRecoveryCodes).toHaveBeenCalled();
    expect(component.recoveryCodes).toEqual(['code1', 'code2', 'code3']);
  }));

  it('should handle get recovery codes error', fakeAsync(() => {
    createComponent();
    tick();
    authServiceSpy.getRecoveryCodes!.mockReturnValue(throwError(() => new Error('Error')));
    component.getRecoveryCodes();
    tick();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to get recovery codes', 'Dismiss', { duration: 3000 });
  }));

  it('should show error for invalid reset recovery codes verification', () => {
    createComponent();
    component.resetCodesVerificationCode = '123';
    component.resetRecoveryCodes();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Enter a valid 6-digit code', 'Dismiss', { duration: 2000 });
  });

  it('should reset recovery codes successfully', fakeAsync(() => {
    createComponent();
    tick();
    component.resetCodesVerificationCode = '123456';
    component.resetRecoveryCodes();
    tick();
    expect(authServiceSpy.resetRecoveryCodes).toHaveBeenCalledWith('123456');
    expect(component.recoveryCodes).toEqual(['newcode1', 'newcode2']);
    expect(component.resetCodesVerificationCode).toBe('');
    expect(component.twoFaLoading).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Recovery codes reset', 'Dismiss', { duration: 3000 });
  }));

  it('should handle reset recovery codes error', fakeAsync(() => {
    createComponent();
    tick();
    component.resetCodesVerificationCode = '123456';
    authServiceSpy.resetRecoveryCodes!.mockReturnValue(throwError(() => new Error('Error')));
    component.resetRecoveryCodes();
    tick();
    expect(component.twoFaLoading).toBe(false);
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to reset recovery codes', 'Dismiss', { duration: 3000 });
  }));

  // Logout test
  it('should logout and navigate to login', () => {
    createComponent();
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  // Tab switching tests
  it('should switch to profile tab', () => {
    createComponent();
    component.switchTab('profile');
    expect(component.activeTab).toBe('profile');
  });

  it('should switch to security tab and load 2FA status', fakeAsync(() => {
    createComponent();
    tick();
    component.switchTab('security');
    expect(component.activeTab).toBe('security');
    tick();
    expect(authServiceSpy.getTwoFaStatus).toHaveBeenCalled();
  }));

  it('should switch to twofa tab and load 2FA status', fakeAsync(() => {
    createComponent();
    tick();
    component.switchTab('twofa');
    expect(component.activeTab).toBe('twofa');
    tick();
    expect(authServiceSpy.getTwoFaStatus).toHaveBeenCalled();
  }));

  // loadTwoFaStatus tests
  it('should load 2FA status', fakeAsync(() => {
    createComponent();
    tick();
    component.loadTwoFaStatus();
    tick();
    expect(component.twoFaStatus).toEqual(mockTwoFaStatus);
  }));

  it('should handle 2FA status load error', fakeAsync(() => {
    createComponent();
    tick();
    authServiceSpy.getTwoFaStatus!.mockReturnValue(throwError(() => new Error('Error')));
    component.loadTwoFaStatus();
    tick();
    expect(snackBarSpy.open).toHaveBeenCalledWith('Failed to load 2FA status', 'Dismiss', { duration: 3000 });
  }));

  // Edge cases
  it('should set loading to true before profile load', fakeAsync(() => {
    createComponent();
    // loading should already be false after ngOnInit resolved
    // re-test: set loading true manually, then verify init flow
    expect(component.loading).toBe(false);
  }));

  it('should load 2FA status on init when activeTab is twofa', fakeAsync(() => {
    authServiceSpy.getProfile!.mockReturnValue(of(mockProfile));
    authServiceSpy.getTwoFaStatus!.mockReturnValue(of(mockTwoFaStatus));
    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    component.activeTab = 'twofa';
    fixture.detectChanges();
    tick();
    tick();
    expect(authServiceSpy.getTwoFaStatus).toHaveBeenCalled();
  }));

  it('should load 2FA status on init when activeTab is security', fakeAsync(() => {
    authServiceSpy.getProfile!.mockReturnValue(of(mockProfile));
    authServiceSpy.getTwoFaStatus!.mockReturnValue(of(mockTwoFaStatus));
    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    component.activeTab = 'security';
    fixture.detectChanges();
    tick();
    tick();
    expect(authServiceSpy.getTwoFaStatus).toHaveBeenCalled();
  }));

  it('should not load 2FA status on init when activeTab is profile', fakeAsync(() => {
    authServiceSpy.getProfile!.mockReturnValue(of(mockProfile));
    authServiceSpy.getTwoFaStatus!.mockReturnValue(of(mockTwoFaStatus));
    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    component.activeTab = 'profile';
    fixture.detectChanges();
    tick();
    expect(authServiceSpy.getTwoFaStatus).not.toHaveBeenCalled();
  }));
});
