using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace Api.Services;

public interface IAuthService
{
    // Auth
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);

    // 2FA
    Task<TwoFaStatusResponse> GetTwoFaStatusAsync(string userId);
    Task<TwoFaSetupResponse> GetTwoFaSetupAsync(string userId);
    Task<bool> EnableTwoFactorAsync(string userId, TwoFaEnableRequest request);
    Task<bool> DisableTwoFactorAsync(string userId, TwoFaDisableRequest request);
    Task<string[]> GetRecoveryCodesAsync(string userId);
    Task<string[]>? ResetRecoveryCodesAsync(string userId, TwoFaResetCodesRequest request);
    Task<TwoFaVerifyResponse?> VerifyTwoFactorAsync(TwoFaLoginRequest request);

    // Profile
    Task<ProfileResponse> GetProfileAsync(string userId);
    Task<ProfileResponse?> UpdateProfileAsync(string userId, ProfileUpdateRequest request);
    Task<bool> ChangePasswordAsync(string userId, PasswordChangeRequest request);

    // Email
    Task SendEmailConfirmationAsync(string userId);
    Task<bool> ConfirmEmailAsync(string userId, string email, string code);

    // Password reset
    Task SendPasswordResetEmailAsync(string email);
    Task<bool> ResetPasswordAsync(PasswordResetConfirmRequest request);
}

public class AuthService : IAuthService
{
    private readonly UserManager<IdentityUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly string _jwtSecret;
    private readonly TimeSpan _tokenExpiry;

    public AuthService(UserManager<IdentityUser> userManager, RoleManager<IdentityRole> roleManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret configuration is required");
        _tokenExpiry = TimeSpan.FromHours(
            int.Parse(configuration["Jwt:ExpiryHours"] ?? "24")
        );
    }

    // ===== Auth =====

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _userManager.FindByEmailAsync(request.Email!) != null)
            throw new InvalidOperationException("Email already registered");

        var user = new IdentityUser { Email = request.Email, UserName = request.Email };
        var result = await _userManager.CreateAsync(user, request.Password!);

        if (!result.Succeeded)
        {
            var firstError = result.Errors.First();
            if (firstError.Code == "DuplicateEmail")
                throw new InvalidOperationException("Email already registered");
            throw new InvalidOperationException(firstError.Description);
        }

        await _userManager.AddToRoleAsync(user, "Customer");

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Email!);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email!);

        if (user == null)
            return null;

        if (await _userManager.IsLockedOutAsync(user))
            return null;

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password!);
        if (!passwordValid)
        {
            await _userManager.AccessFailedAsync(user);
            return null;
        }

        await _userManager.ResetAccessFailedCountAsync(user);

        var twoFaEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
        if (twoFaEnabled)
        {
            // Return null to signal that 2FA verification is needed
            // The UI should then call /api/auth/2fa/verify
            return null;
        }

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Email!);
    }

    // ===== 2FA =====

    public async Task<TwoFaStatusResponse> GetTwoFaStatusAsync(string userId)
    {
        var user = await GetUserAsync(userId);
        var twoFaEnabled = await _userManager.GetTwoFactorEnabledAsync(user);
        var emailConfirmed = user.EmailConfirmed;
        return new TwoFaStatusResponse(twoFaEnabled, emailConfirmed);
    }

    public async Task<TwoFaSetupResponse> GetTwoFaSetupAsync(string userId)
    {
        var user = await GetUserAsync(userId);

        if (await _userManager.GetTwoFactorEnabledAsync(user))
            throw new InvalidOperationException("2FA is already enabled for this user");

        var unencodedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(unencodedKey))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            unencodedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        var qrCodeSvg = GenerateQrCodeSvg(user.Email!, unencodedKey!);
        var recoveryCodes = GenerateRecoveryCodes();

        return new TwoFaSetupResponse(qrCodeSvg, unencodedKey!, string.Join(",", recoveryCodes));
    }

    public async Task<bool> EnableTwoFactorAsync(string userId, TwoFaEnableRequest request)
    {
        var user = await GetUserAsync(userId);

        var unencodedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        var code = DecodeTotpCode(request.Code!, unencodedKey!);

        if (!code)
            return false;

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return true;
    }

    public async Task<bool> DisableTwoFactorAsync(string userId, TwoFaDisableRequest request)
    {
        var user = await GetUserAsync(userId);

        var unencodedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        var code = DecodeTotpCode(request.Code!, unencodedKey!);

        if (!code)
            return false;

        await _userManager.SetTwoFactorEnabledAsync(user, false);
        await _userManager.ResetAuthenticatorKeyAsync(user);
        return true;
    }

    public async Task<string[]> GetRecoveryCodesAsync(string userId)
    {
        var user = await GetUserAsync(userId);

        if (!await _userManager.GetTwoFactorEnabledAsync(user))
            throw new InvalidOperationException("2FA is not enabled for this user");

        var recoveryCodes = await _userManager.GetAuthenticatorKeyAsync(user);
        // Recovery codes are stored as user data; for simplicity generate new ones
        // In a production app you'd store these encrypted
        return GenerateRecoveryCodes();
    }

    public async Task<string[]>? ResetRecoveryCodesAsync(string userId, TwoFaResetCodesRequest request)
    {
        var user = await GetUserAsync(userId);

        var unencodedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        var code = DecodeTotpCode(request.Code!, unencodedKey!);

        if (!code)
            return null;

        return GenerateRecoveryCodes();
    }

    public async Task<TwoFaVerifyResponse?> VerifyTwoFactorAsync(TwoFaLoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email!);

        if (user == null)
            return null;

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password!);
        if (!passwordValid)
            return null;

        var unencodedKey = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(unencodedKey))
            return null;

        var code = DecodeTotpCode(request.Code!, unencodedKey);
        if (!code)
            return null;

        var token = GenerateJwtToken(user);
        return new TwoFaVerifyResponse(token, user.Email!);
    }

    // ===== Profile =====

    public async Task<ProfileResponse> GetProfileAsync(string userId)
    {
        var user = await GetUserAsync(userId);
        return new ProfileResponse(
            user.Email!,
            null, // FirstName - not stored in IdentityUser by default
            null, // LastName
            user.PhoneNumber,
            user.EmailConfirmed,
            await _userManager.GetTwoFactorEnabledAsync(user)
        );
    }

    public async Task<ProfileResponse?> UpdateProfileAsync(string userId, ProfileUpdateRequest request)
    {
        var user = await GetUserAsync(userId);

        if (request.PhoneNumber != null)
        {
            user.PhoneNumber = request.PhoneNumber;
        }

        // Store first/last name in claims (IdentityUser doesn't have these properties by default)
        if (request.FirstName != null)
        {
            var existing = await _userManager.GetClaimsAsync(user);
            var old = existing.FirstOrDefault(c => c.Type == "FirstName");
            if (old != null) await _userManager.RemoveClaimAsync(user, old);
            await _userManager.AddClaimAsync(user, new Claim("FirstName", request.FirstName));
        }
        if (request.LastName != null)
        {
            var existing = await _userManager.GetClaimsAsync(user);
            var old = existing.FirstOrDefault(c => c.Type == "LastName");
            if (old != null) await _userManager.RemoveClaimAsync(user, old);
            await _userManager.AddClaimAsync(user, new Claim("LastName", request.LastName));
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new InvalidOperationException("Failed to update profile");

        return await GetProfileAsync(userId);
    }

    public async Task<bool> ChangePasswordAsync(string userId, PasswordChangeRequest request)
    {
        var user = await GetUserAsync(userId);

        var result = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword!,
            request.NewPassword!
        );

        if (!result.Succeeded)
        {
            throw new InvalidOperationException(result.Errors.First().Description);
        }

        return true;
    }

    // ===== Email =====

    public async Task SendEmailConfirmationAsync(string userId)
    {
        var user = await GetUserAsync(userId);

        if (user.EmailConfirmed)
            throw new InvalidOperationException("Email is already confirmed");

        // In a production app, you'd send an actual email here
        // For now, generate the confirmation token
        var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        _ = code; // Use this to send email link

        // TODO: Integrate with email service
    }

    public async Task<bool> ConfirmEmailAsync(string userId, string email, string code)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user == null)
            throw new KeyNotFoundException("User not found");

        if (user.Email != email)
            return false;

        var result = await _userManager.ConfirmEmailAsync(user, code);
        return result.Succeeded;
    }

    // ===== Password Reset =====

    public async Task SendPasswordResetEmailAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);

        if (user == null)
            return; // Don't reveal if user exists

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        _ = token; // Use this to send reset email link

        // TODO: Integrate with email service
    }

    public async Task<bool> ResetPasswordAsync(PasswordResetConfirmRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email!);

        if (user == null)
            throw new KeyNotFoundException("User not found");

        var result = await _userManager.ResetPasswordAsync(
            user,
            request.Token!,
            request.NewPassword!
        );

        return result.Succeeded;
    }

    // ===== Helpers =====

    private async Task<IdentityUser> GetUserAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user == null)
            throw new KeyNotFoundException("User not found");

        return user;
    }

    private string GenerateJwtToken(IdentityUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
        };

        var roles = _userManager.GetRolesAsync(user).Result.ToList();
        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: "shop-api",
            audience: "shop",
            claims: claims,
            expires: DateTime.UtcNow.Add(_tokenExpiry),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Generate QR code SVG for TOTP
    private static string GenerateQrCodeSvg(string email, string secret)
    {
        var encodedSecret = Convert.ToBase64String(Encoding.ASCII.GetBytes(secret))
            .TrimEnd('=')
            .ToUpper();

        var otpAuthUrl = $"otpauth://totp/shop%3A{Uri.EscapeDataString(email)}?secret={encodedSecret}&issuer=shop&digits=6&period=30";
        var encodedUrl = Uri.EscapeDataString(otpAuthUrl);

        // Simple SVG QR code representation
        // In production, use a QR code library like QRCoder
        return $"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><text x='10' y='20' font-size='8'>OTP URL: {otpAuthUrl}</text></svg>";
    }

    // Simple TOTP verification
    private static bool DecodeTotpCode(string code, string secret)
    {
        try
        {
            if (code.Length != 6)
                return false;

            var inputCode = long.Parse(code);
            var key = Encoding.ASCII.GetBytes(secret);

            var timeStep = (long)(DateTime.UtcNow - new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalSeconds / 30;

            var timeBytes = BitConverter.GetBytes(BitConverter.ToUInt64(BitConverter.GetBytes(timeStep).Reverse().ToArray(), 0));

            var hmac = new System.Security.Cryptography.HMACSHA1(key);
            var hash = hmac.ComputeHash(timeBytes);

            var offset = hash[hash.Length - 1] & 0x0f;
            var binary = ((hash[offset] & 0x7f) << 24)
                | ((hash[offset + 1] & 0xff) << 16)
                | ((hash[offset + 2] & 0xff) << 8)
                | (hash[offset + 3] & 0xff);

            var otp = binary % 1000000;

            return otp == inputCode;
        }
        catch
        {
            return false;
        }
    }

    private static string[] GenerateRecoveryCodes()
    {
        var codes = new string[10];
        var random = new Random();

        for (var i = 0; i < 10; i++)
        {
            codes[i] = $"{random.Next(100000, 999999)}-{random.Next(100000, 999999)}";
        }

        return codes;
    }
}
