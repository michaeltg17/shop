using Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.OrdersEndpoints;

public static class GetOrdersEndpoint
{
    public static IEndpointRouteBuilder MapGetOrdersEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/orders", ([FromServices] OrderStore store) =>
            store.GetAll());

        return app;
    }
}
