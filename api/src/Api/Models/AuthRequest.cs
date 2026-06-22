using System.ComponentModel.DataAnnotations;

namespace Api.Models;

public record RegisterRequest(
    [Required] string Username,
    [Required] string Email,
    [Required] string Password
);

public record LoginRequest(
    [Required] string Username,
    [Required] string Password
);

public record AuthResponse(
    string Token,
    string Username,
    string Email
);
