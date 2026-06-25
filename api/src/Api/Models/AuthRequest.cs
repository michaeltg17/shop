using System.ComponentModel.DataAnnotations;

namespace Api.Models;

public record RegisterRequest(
    [Required] string Email,
    [Required] string Password
);

public record LoginRequest(
    [Required] string Email,
    [Required] string Password
);

public record AuthResponse(
    string Token,
    string Email
);

// 2FA DTOs
public record TwoFaStatusResponse(bool IsEnabled, bool IsEmailConfirmed);

public record TwoFaSetupResponse(
    string QrCodeSvg,
    string Secret,
    string RecoveryCodes
);

public record TwoFaEnableRequest([Required] string Code);

public record TwoFaDisableRequest([Required] string Code);

public record TwoFaResetCodesRequest([Required] string Code);

public record TwoFaLoginRequest(
    [Required] string Email,
    [Required] string Password,
    [Required] string Code
);

public record TwoFaVerifyResponse(
    string Token,
    string Email
);

// Profile DTOs
public record ProfileResponse(
    string Email,
    string? FirstName,
    string? LastName,
    string? PhoneNumber,
    bool EmailConfirmed,
    bool TwoFactorEnabled
);

public record ProfileUpdateRequest(
    string? FirstName,
    string? LastName,
    string? PhoneNumber
);

public record PasswordChangeRequest(
    [Required] string CurrentPassword,
    [Required] string NewPassword
);

// Password reset DTOs
public record PasswordResetRequest([Required] string Email);

public record PasswordResetConfirmRequest(
    [Required] string Email,
    [Required] string Token,
    [Required] string NewPassword
);
