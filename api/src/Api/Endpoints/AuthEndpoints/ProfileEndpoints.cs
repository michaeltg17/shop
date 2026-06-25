using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.AuthEndpoints;

public static class ProfileEndpoints
{
    public static IEndpointRouteBuilder MapProfileEndpoints(this IEndpointRouteBuilder app)
    {
        // Get current user profile
        app.MapGet("/api/auth/profile", async ([FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                var profile = await authService.GetProfileAsync(userId);
                return Results.Ok(profile);
            }
            catch (KeyNotFoundException)
            {
                return Results.NotFound(new { error = "User not found" });
            }
        });

        // Update profile
        app.MapPut("/api/auth/profile", async ([FromBody] ProfileUpdateRequest req, [FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                var result = await authService.UpdateProfileAsync(userId, req);
                return result != null
                    ? Results.Ok(result)
                    : Results.BadRequest(new { error = "Failed to update profile" });
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

        // Change password
        app.MapPost("/api/auth/password/change", async ([FromBody] PasswordChangeRequest req, [FromServices] IAuthService authService, [FromHeader(Name = "X-User-Id")] string userId) =>
        {
            try
            {
                var result = await authService.ChangePasswordAsync(userId, req);
                return result
                    ? Results.Ok(new { message = "Password changed successfully" })
                    : Results.BadRequest(new { error = "Invalid current password" });
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
