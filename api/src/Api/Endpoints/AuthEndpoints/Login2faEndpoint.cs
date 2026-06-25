using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.AuthEndpoints;

public static class Login2faEndpoint
{
    public static IEndpointRouteBuilder MapLogin2faEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/2fa/verify", async ([FromBody] TwoFaLoginRequest req, [FromServices] IAuthService authService) =>
        {
            var result = await authService.VerifyTwoFactorAsync(req);
            if (result == null)
                return Results.Problem(
                    detail: "Invalid 2FA code",
                    title: "Unauthorized",
                    statusCode: StatusCodes.Status401Unauthorized,
                    type: "https://tools.ietf.org/html/rfc7235#section-3.1"
                );
            return Results.Ok(result);
        });

        return app;
    }
}
