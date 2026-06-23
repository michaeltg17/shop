using Api.Data;
using Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.ProductsEndpoints;

public static class CreateProductEndpoint
{
    public static IEndpointRouteBuilder MapCreateProductEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/products", async ([FromBody] Product product, [FromServices] AppDbContext context) =>
        {
            context.Products.Add(product);
            await context.SaveChangesAsync();
            return Results.Created($"/api/products/{product.Id}", product);
        })
        .RequireAuthorization();

        return app;
    }
}
