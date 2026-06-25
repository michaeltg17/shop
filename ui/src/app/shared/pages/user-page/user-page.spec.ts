import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserPage } from './user-page';
import { provideRouter, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

describe('UserPage', () => {
  let component: UserPage;
  let fixture: ComponentFixture<UserPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserPage, RouterModule],
      providers: [
        provideRouter([
          { path: 'shop', redirectTo: '', pathMatch: 'full' },
          { path: 'admin/users', redirectTo: '', pathMatch: 'full' },
          { path: '', redirectTo: '', pathMatch: 'full' },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => true,
            user: () => ({ username: 'Test', email: 'test@test.com', isAdmin: false }),
            logout: jest.fn(),
            getProfile: () =>
              of({
                id: 'u1',
                email: 'test@test.com',
                displayName: 'Test',
                isEmailConfirmed: true,
                isTwoFactorEnabled: false,
                roles: ['Customer'],
              }),
            updateProfile: () => of({}),
            changePassword: () => of(true),
            sendEmailConfirmation: () => of(true),
            confirmEmail: () => of(true),
            getTwoFaStatus: () => of({}),
            getTwoFaSetup: () => of({}),
            enableTwoFactor: () => of(true),
            disableTwoFactor: () => of(true),
            getRecoveryCodes: () => of([]),
            resetRecoveryCodes: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
