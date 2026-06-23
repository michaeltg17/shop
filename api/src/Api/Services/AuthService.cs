using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
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

        var token = GenerateJwtToken(user);
        var roles = await _userManager.GetRolesAsync(user);
        return new AuthResponse(token, user.Email!);
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
}
