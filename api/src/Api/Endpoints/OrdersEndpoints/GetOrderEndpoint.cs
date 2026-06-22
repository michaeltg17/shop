using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.OrdersEndpoints;

public static class GetOrderEndpoint
{
    public static IEndpointRouteBuilder MapGetOrderEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/orders/{id}", (int id, [FromServices] OrderStore store) =>
        {
            if (!store.TryGet(id, out var order))
                return Results.Problem(
                    detail: $"Order with id {id} not found",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
                );

            return Results.Ok(order);
        });

        return app;
    }
}
