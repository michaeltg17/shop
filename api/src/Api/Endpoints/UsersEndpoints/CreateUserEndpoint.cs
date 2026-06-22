using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.UsersEndpoints;

public static class CreateUserEndpoint
{
    public static IEndpointRouteBuilder MapCreateUserEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/users", ([FromBody] AdminUser user, [FromServices] UserStore store) =>
        {
            var newUser = store.Add(user);
            return Results.Created($"/api/users/{newUser.Id}", newUser);
        });

        return app;
    }
}
