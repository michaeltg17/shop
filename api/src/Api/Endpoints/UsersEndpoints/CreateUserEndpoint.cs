using Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.UsersEndpoints;

public static class CreateUserEndpoint
{
    public static IEndpointRouteBuilder MapCreateUserEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/users", async ([FromBody] CreateUserRequest req, [FromServices] UserManager<IdentityUser> userManager) =>
        {
            var existingUser = await userManager.FindByEmailAsync(req.Email);
            if (existingUser != null)
                return Results.Problem(
                    detail: "Email already registered",
                    title: "Bad Request",
                    statusCode: StatusCodes.Status400BadRequest,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.1"
                );

            var password = req.Password ?? $"{req.Email}_Secure1!";
            var user = new IdentityUser { Email = req.Email, UserName = req.Email };
            var result = await userManager.CreateAsync(user, password);

            if (!result.Succeeded)
                return Results.Problem(
                    detail: result.Errors.First().Description,
                    title: "Bad Request",
                    statusCode: StatusCodes.Status400BadRequest,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.1"
                );

            if (req.Role == "Admin")
                await userManager.AddToRoleAsync(user, "Admin");
            else
                await userManager.AddToRoleAsync(user, "Customer");

            return Results.Created($"/api/users/{user.Id}", user);
        })
        .RequireAuthorization("Admin");

        return app;
    }
}

public record CreateUserRequest(
    string Email,
    string? Password,
    string Role = "Customer"
);
