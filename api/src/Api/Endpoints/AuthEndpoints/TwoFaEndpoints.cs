using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.AuthEndpoints;

public static class TwoFaEndpoints
{
    public static IEndpointRouteBuilder MapTwoFaEndpoints(this IEndpointRouteBuilder app)
    {
        // Check if 2FA is enabled for the current user
        app.MapGet("/api/auth/2fa/status", async ([FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                var status = await authService.GetTwoFaStatusAsync(userId);
                return Results.Ok(status);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new { error = "User not found" });
            }
        });

        // Get 2FA setup QR code (as base64 SVG)
        app.MapGet("/api/auth/2fa/setup", async ([FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                var setupInfo = await authService.GetTwoFaSetupAsync(userId);
                return Results.Ok(setupInfo);
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

        // Enable 2FA
        app.MapPost("/api/auth/2fa/enable", async ([FromBody] TwoFaEnableRequest req, [FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                var result = await authService.EnableTwoFactorAsync(userId, req);
                return result
                    ? Results.Ok(new { message = "2FA enabled successfully" })
                    : Results.BadRequest(new { error = "Invalid verification code" });
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new { error = "User not found" });
            }
        });

        // Disable 2FA
        app.MapPost("/api/auth/2fa/disable", async ([FromBody] TwoFaDisableRequest req, [FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                var result = await authService.DisableTwoFactorAsync(userId, req);
                return result
                    ? Results.Ok(new { message = "2FA disabled successfully" })
                    : Results.BadRequest(new { error = "Invalid verification code" });
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new { error = "User not found" });
            }
        });

        // Get recovery codes
        app.MapGet("/api/auth/2fa/recovery-codes", async ([FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                var codes = await authService.GetRecoveryCodesAsync(userId);
                return Results.Ok(new { codes, resetRequired = false });
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new { error = "User not found" });
            }
        });

        // Reset recovery codes
        app.MapPost("/api/auth/2fa/recovery-codes/reset", async ([FromBody] TwoFaResetCodesRequest req, [FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                var result = await authService.ResetRecoveryCodesAsync(userId, req);
                return result != null
                    ? Results.Ok(new { codes = result, resetRequired = true })
                    : Results.BadRequest(new { error = "Invalid verification code" });
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new { error = "User not found" });
            }
        });

        return app;
    }
}
