using Api.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Api.Endpoints.ProductsEndpoints;

public static class UpdateProductEndpoint
{
    public static IEndpointRouteBuilder MapUpdateProductEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/api/products/{id}", async (int id, [FromBody] UpdateProductRequest req, [FromServices] AppDbContext context) =>
        {
            var product = await context.Products.FindAsync(id);
            if (product == null)
                return Results.Problem(
                    detail: $"Product with id {id} not found",
                    title: "Not Found",
                    statusCode: StatusCodes.Status404NotFound,
                    type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
                );

            product.Name = req.Name;
            product.Description = req.Description;
            product.Price = req.Price;
            product.Category = req.Category;
            product.Image = req.Image;
            await context.SaveChangesAsync();

            return Results.Ok(product);
        })
        .RequireAuthorization();

        return app;
    }
}

public record UpdateProductRequest(string Name, string Description, decimal Price, string Category, string Image);
