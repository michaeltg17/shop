using Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints.UsersEndpoints;

public static class DeleteUsersEndpoint
{
    public static IEndpointRouteBuilder MapDeleteUsersEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/users", async ([FromBody] List<string> ids, [FromServices] AppDbContext context) =>
        {
            var users = await context.Users!
                .Where(u => ids.Contains(u.Id))
                .ToListAsync();

            context.Users!.RemoveRange(users);
            await context.SaveChangesAsync();

            return Results.NoContent();
        })
        .RequireAuthorization("Admin");

        return app;
    }
}
