using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.OrdersEndpoints;

public static class CreateOrderEndpoint
{
    public static IEndpointRouteBuilder MapCreateOrderEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/orders", ([FromBody] OrderRequest orderRequest, [FromServices] OrderStore store) =>
        {
            var order = store.Add(orderRequest);
            return Results.Created($"/api/orders/{order.Id}", order);
        });

        return app;
    }
}
