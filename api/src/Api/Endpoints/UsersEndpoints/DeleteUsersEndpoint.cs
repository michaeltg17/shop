using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.UsersEndpoints;

public static class DeleteUsersEndpoint
{
    public static IEndpointRouteBuilder MapDeleteUsersEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/users", ([FromBody] List<int> ids, [FromServices] UserStore store) =>
        {
            store.RemoveRange(ids);
            return Results.NoContent();
        });

        return app;
    }
}
