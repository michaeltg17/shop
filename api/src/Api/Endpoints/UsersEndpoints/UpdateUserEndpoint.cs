using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.UsersEndpoints;

public static class UpdateUserEndpoint
{
    public static IEndpointRouteBuilder MapUpdateUserEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/api/users/{id}", async (string id, [FromBody] UpdateUserRequest req, [FromServices] UserManager<IdentityUser> userManager) =>
        {
            var user = await userManager.FindByIdAsync(id);
            if (user == null)
                return Results.Problem(
                    detail: $"User with id {id} not found",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
                );

            if (req.Email != null)
            {
                user.Email = req.Email;
                user.UserName = req.Email;
                await userManager.UpdateAsync(user);
            }

            if (req.IsActive.HasValue)
            {
                if (req.IsActive.Value)
                    await userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MinValue);
                else
                    await userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
            }

            return Results.Ok(user);
        })
        .RequireAuthorization("Admin");

        return app;
    }
}

public record UpdateUserRequest(
    string? Email,
    bool? IsActive
);
