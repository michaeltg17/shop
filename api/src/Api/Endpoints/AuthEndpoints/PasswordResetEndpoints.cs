using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.AuthEndpoints;

public static class PasswordResetEndpoints
{
    public static IEndpointRouteBuilder MapPasswordResetEndpoints(this IEndpointRouteBuilder app)
    {
        // Send password reset email
        app.MapPost("/api/auth/password/reset/send", async ([FromBody] PasswordResetRequest req, [FromServices] IAuthService authService) =>
        {
            try
            {
                await authService.SendPasswordResetEmailAsync(req.Email!);
                // Always return OK to prevent email enumeration
                return Results.Ok(new { message = "If an account with that email exists, a password reset link has been sent" });
            }
            catch (Exception ex)
            {
                return Results.Problem(
                    detail: ex.Message,
                    title: "Internal Server Error",
                    statusCode: StatusCodes.Status500InternalServerError
                );
            }
        });

        // Reset password (called from reset link)
        app.MapPost("/api/auth/password/reset", async ([FromBody] PasswordResetConfirmRequest req, [FromServices] IAuthService authService) =>
        {
            try
            {
                var result = await authService.ResetPasswordAsync(req);
                return result
                    ? Results.Ok(new { message = "Password reset successfully" })
                    : Results.BadRequest(new { error = "Invalid or expired reset token" });
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

        return app;
    }
}
