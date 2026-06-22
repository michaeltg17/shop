using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.UsersEndpoints;

public static class UpdateUserEndpoint
{
    public static IEndpointRouteBuilder MapUpdateUserEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/api/users/{id}", (int id, [FromBody] AdminUser user, [FromServices] UserStore store) =>
        {
            if (!store.Update(id, user))
                return Results.Problem(
                    detail: $"User with id {id} not found",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
                );

            return Results.Ok(user with { Id = id });
        });

        return app;
    }
}
