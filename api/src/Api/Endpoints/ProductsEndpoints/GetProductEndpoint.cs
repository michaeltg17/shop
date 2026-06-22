using Api.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.ProductsEndpoints;

public static class GetProductEndpoint
{
    public static IEndpointRouteBuilder MapGetProductEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/products/{id}", (int id, [FromServices] ProductStore store) =>
        {
            if (!store.TryGet(id, out var product))
                return Results.Problem(
                    detail: $"Product with id {id} not found",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
                );

            return Results.Ok(product);
        }).WithName("GetProduct");

        return app;
    }
}
