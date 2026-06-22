using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace Api.Services;

public interface IAuthService
{
    AuthResponse Register(RegisterRequest request);
    AuthResponse? Login(LoginRequest request);
    User? GetUserByUsername(string username);
}

public class AuthService : IAuthService
{
    private readonly ConcurrentDictionary<string, User> _users = new();
    private readonly string _jwtSecret;
    private readonly TimeSpan _tokenExpiry;
    private int _nextUserId = 0;

    public AuthService(IConfiguration configuration)
    {
        _jwtSecret = configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("Jwt:Secret configuration is required");
        _tokenExpiry = TimeSpan.FromHours(
            int.Parse(configuration["Jwt:ExpiryHours"] ?? "24")
        );
    }

    public AuthResponse Register(RegisterRequest request)
    {
        if (_users.ContainsKey(request.Username.ToLowerInvariant()))
            throw new InvalidOperationException("Username already taken");

        var emailKey = request.Email.ToLowerInvariant();
        if (_users.Values.Any(u => u.Email == emailKey))
            throw new InvalidOperationException("Email already registered");

        if (request.Password.Length < 8)
            throw new InvalidOperationException("Password must be at least 8 characters");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        var id = Interlocked.Increment(ref _nextUserId);
        var user = new User(id, request.Username, request.Email, passwordHash);

        _users.TryAdd(request.Username.ToLowerInvariant(), user);

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Username, user.Email);
    }

    public AuthResponse? Login(LoginRequest request)
    {
        if (!_users.TryGetValue(request.Username.ToLowerInvariant(), out var u))
            return null;
        var user = u;
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Username, user.Email);
    }

    public User? GetUserByUsername(string username)
        => _users.TryGetValue(username.ToLowerInvariant(), out var u) ? u : null;

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
        };

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
