using Api.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.ProductsEndpoints;

public static class DeleteProductEndpoint
{
    public static IEndpointRouteBuilder MapDeleteProductEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/api/products/{id}", async (int id, [FromServices] AppDbContext context) =>
        {
            var product = await context.Products.FindAsync(id);
            if (product == null)
                return Results.Problem(
                    detail: $"Product with id {id} not found",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
                );

            context.Products.Remove(product);
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .RequireAuthorization();

        return app;
    }
}
