using System.Collections.Concurrent;
using System.Text;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();
}

// Register auth service
builder.Services.AddSingleton<IAuthService, AuthService>();

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret configuration is required");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "shop-api",
            ValidAudience = "shop",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

// In-memory product storage
var seedProducts = new List<Product>
{
    new(1, "Laptop", "High-performance laptop", 999.99m),
    new(2, "Mouse", "Wireless ergonomic mouse", 29.99m),
    new(3, "Keyboard", "Mechanical keyboard", 79.99m)
};

var products = new ConcurrentDictionary<int, Product>(seedProducts.ToDictionary(p => p.Id, p => p));
int nextId = 4;

// ── Auth endpoints ──

app.MapPost("/api/auth/register", (RegisterRequest request, IAuthService authService) =>
{
    try
    {
        var result = authService.Register(request);
        return Results.Ok(result);
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapPost("/api/auth/login", (LoginRequest request, IAuthService authService) =>
{
    var result = authService.Login(request);
    if (result == null)
        return Results.Json(new { error = "Invalid credentials" }, statusCode: StatusCodes.Status401Unauthorized);
    return Results.Ok(result);
});

// ── Product endpoints ──

// GET /api/products
app.MapGet("/api/products", () =>
    products.Values.ToList());

// GET /api/products/{id}
app.MapGet("/api/products/{id}", (int id) =>
    products.TryGetValue(id, out var product)
        ? Results.Ok(product)
        : Results.NotFound())
    .WithName("GetProduct");

// POST /api/products (requires auth)
app.MapPost("/api/products", (Product product, IAuthService authService) =>
{
    var newProduct = product with { Id = Interlocked.Increment(ref nextId) };
    products.TryAdd(newProduct.Id, newProduct);
    return Results.CreatedAtRoute("GetProduct", new { id = newProduct.Id }, newProduct);
}).RequireAuthorization();

// PUT /api/products/{id} (requires auth)
app.MapPut("/api/products/{id}", (int id, Product product) =>
{
    if (!products.ContainsKey(id))
        return Results.NotFound();

    var updatedProduct = product with { Id = id };
    products[id] = updatedProduct;
    return Results.Ok(updatedProduct);
}).RequireAuthorization();

// DELETE /api/products/{id} (requires auth)
app.MapDelete("/api/products/{id}", (int id) =>
{
    if (!products.TryRemove(id, out _))
        return Results.NotFound();

    return Results.NoContent();
}).RequireAuthorization();

app.Run();
