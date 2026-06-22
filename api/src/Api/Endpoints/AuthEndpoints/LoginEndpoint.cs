using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.AuthEndpoints;

public static class LoginEndpoint
{
    public static IEndpointRouteBuilder MapLoginEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/auth/login", async ([FromBody] LoginRequest req, [FromServices] IAuthService authService) =>
        {
            var result = authService.Login(req);
            if (result == null)
                return Results.Problem(
                    detail: "Invalid credentials",
                    title: "Unauthorized",
                    statusCode: StatusCodes.Status401Unauthorized,
                    type: "https://tools.ietf.org/html/rfc7235#section-3.1"
                );
            return Results.Ok(result);
        });

        return app;
    }
}
