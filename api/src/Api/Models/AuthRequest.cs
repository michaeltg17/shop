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
