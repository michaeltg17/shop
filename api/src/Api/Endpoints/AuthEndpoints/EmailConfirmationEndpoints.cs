using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.AuthEndpoints;

public static class EmailConfirmationEndpoints
{
    public static IEndpointRouteBuilder MapEmailConfirmationEndpoints(this IEndpointRouteBuilder app)
    {
        // Send email confirmation
        app.MapPost("/api/auth/email/confirm/send", async ([FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                await authService.SendEmailConfirmationAsync(userId);
                return Results.Ok(new { message = "Confirmation email sent" });
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new { error = "User not found" });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        });

        // Verify email confirmation (called from email link)
        app.MapGet("/api/auth/email/confirm", async (
            [FromQuery] string userId,
            [FromQuery] string email,
            [FromQuery] string code,
            [FromQuery] string? tenant,
            [FromServices] IAuthService authService) =>
        {
            try
            {
                var result = await authService.ConfirmEmailAsync(userId, email, code);
                return result
                    ? Results.Ok(new { message = "Email confirmed successfully" })
                    : Results.BadRequest(new { error = "Invalid or expired confirmation code" });
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new { error = "User not found" });
            }
        });

        return app;
    }
}
