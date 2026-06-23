using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints.UsersEndpoints;

public static class GetUsersEndpoint
{
    public static IEndpointRouteBuilder MapGetUsersEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/users", async ([FromServices] UserManager<IdentityUser> userManager) =>
        {
            var users = await userManager.Users
                .OrderBy(u => u.Email)
                .ToListAsync();

            return Results.Ok(users);
        })
        .RequireAuthorization("Admin");

        return app;
    }
}
