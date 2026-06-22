using System.Collections.Concurrent;
using System.Text;
using Api.Models;
using Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
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

// ── In-memory storage ──

// Products
var seedProducts = new List<Product>
{
    new(1, "Laptop", "High-performance laptop", 999.99m, "Electronics", "https://placehold.co/400x300/3b82f6/white?text=Laptop", new ProductRating(4.5, 120)),
    new(2, "Mouse", "Wireless ergonomic mouse", 29.99m, "Electronics", "https://placehold.co/400x300/ef4444/white?text=Mouse", new ProductRating(4.2, 85)),
    new(3, "Keyboard", "Mechanical keyboard", 79.99m, "Electronics", "https://placehold.co/400x300/22c55e/white?text=Keyboard", new ProductRating(4.7, 200))
};

var products = new ConcurrentDictionary<int, Product>(seedProducts.ToDictionary(p => p.Id, p => p));
int nextProductId = 4;

// Admin Users (for the admin panel)
var seedUsers = new List<AdminUser>
{
    new(1, "Michael", "Garcia", "michael@example.com", "+1-555-0101", true),
    new(2, "Sarah", "Johnson", "sarah@example.com", "+1-555-0102", true),
    new(3, "James", "Wilson", "james@example.com", "+1-555-0103", false)
};

var users = new ConcurrentDictionary<int, AdminUser>(seedUsers.ToDictionary(u => u.Id, u => u));
int nextUserId = 4;

// Orders
var orders = new ConcurrentDictionary<int, Order>();
int nextOrderId = 1;

// ── Auth endpoints ──

app.MapPost("/api/auth/register", ([FromBody] RegisterRequest request, IAuthService authService) =>
{
    try
    {
        var result = authService.Register(request);
        return Results.Ok(result);
    }
    catch (InvalidOperationException ex)
    {
        return Results.Problem(
            detail: ex.Message,
            title: "Bad Request",
            statusCode: StatusCodes.Status400BadRequest,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.1"
        );
    }
});

app.MapPost("/api/auth/login", ([FromBody] LoginRequest request, IAuthService authService) =>
{
    var result = authService.Login(request);
    if (result == null)
        return Results.Problem(
            detail: "Invalid credentials",
            title: "Unauthorized",
            statusCode: StatusCodes.Status401Unauthorized,
            type: "https://tools.ietf.org/html/rfc7235#section-3.1"
        );
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
        : Results.Problem(
            detail: $"Product with id {id} not found",
            title: "Not Found",
            statusCode: StatusCodes.Status404NotFound,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
        ))
    .WithName("GetProduct");

// POST /api/products (requires auth)
app.MapPost("/api/products", (HttpContext ctx, [FromBody] Product product) =>
{
    if (!ctx.User.Identity!.IsAuthenticated)
        return Results.Problem(
            detail: "Authentication required",
            title: "Unauthorized",
            statusCode: StatusCodes.Status401Unauthorized,
            type: "https://tools.ietf.org/html/rfc7235#section-3.1"
        );
    var newProduct = product with { Id = Interlocked.Increment(ref nextProductId) };
    products.TryAdd(newProduct.Id, newProduct);
    return Results.CreatedAtRoute("GetProduct", new { id = newProduct.Id }, newProduct);
});

// PUT /api/products/{id} (requires auth)
app.MapPut("/api/products/{id}", (HttpContext ctx, int id, [FromBody] Product product) =>
{
    if (!ctx.User.Identity!.IsAuthenticated)
        return Results.Problem(
            detail: "Authentication required",
            title: "Unauthorized",
            statusCode: StatusCodes.Status401Unauthorized,
            type: "https://tools.ietf.org/html/rfc7235#section-3.1"
        );
    if (!products.ContainsKey(id))
        return Results.Problem(
            detail: $"Product with id {id} not found",
            title: "Not Found",
            statusCode: StatusCodes.Status404NotFound,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
        );

    var updatedProduct = product with { Id = id };
    products[id] = updatedProduct;
    return Results.Ok(updatedProduct);
});

// DELETE /api/products/{id} (requires auth)
app.MapDelete("/api/products/{id}", (HttpContext ctx, int id) =>
{
    if (!ctx.User.Identity!.IsAuthenticated)
        return Results.Problem(
            detail: "Authentication required",
            title: "Unauthorized",
            statusCode: StatusCodes.Status401Unauthorized,
            type: "https://tools.ietf.org/html/rfc7235#section-3.1"
        );
    if (!products.TryRemove(id, out _))
        return Results.Problem(
            detail: $"Product with id {id} not found",
            title: "Not Found",
            statusCode: StatusCodes.Status404NotFound,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
        );

    return Results.NoContent();
});

// ── User endpoints (admin panel) ──

// GET /api/users
app.MapGet("/api/users", () =>
    users.Values.ToList());

// POST /api/users
app.MapPost("/api/users", ([FromBody] AdminUser user) =>
{
    var newUser = user with { Id = Interlocked.Increment(ref nextUserId) };
    users.TryAdd(newUser.Id, newUser);
    return Results.Created($"/api/users/{newUser.Id}", newUser);
});

// PUT /api/users/{id}
app.MapPut("/api/users/{id}", (int id, [FromBody] AdminUser user) =>
{
    if (!users.ContainsKey(id))
        return Results.Problem(
            detail: $"User with id {id} not found",
            title: "Not Found",
            statusCode: StatusCodes.Status404NotFound,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
        );

    var updatedUser = user with { Id = id };
    users[id] = updatedUser;
    return Results.Ok(updatedUser);
});

// DELETE /api/users (bulk delete by IDs)
app.MapDelete("/api/users", ([FromBody] List<int> ids) =>
{
    foreach (var id in ids)
    {
        users.TryRemove(id, out _);
    }
    return Results.NoContent();
});

// ── Order endpoints ──

// POST /api/orders
app.MapPost("/api/orders", ([FromBody] OrderRequest orderRequest) =>
{
    var total = orderRequest.Items.Sum(i => i.Price * i.Quantity);
    var order = new Order(
        Id: Interlocked.Increment(ref nextOrderId),
        Items: orderRequest.Items,
        Total: total,
        Shipping: orderRequest.Shipping,
        Status: "pending",
        CreatedAt: DateTime.UtcNow
    );
    orders.TryAdd(order.Id, order);
    return Results.Created($"/api/orders/{order.Id}", order);
});

// GET /api/orders
app.MapGet("/api/orders", () =>
    orders.Values.OrderByDescending(o => o.CreatedAt).ToList());

// GET /api/orders/{id}
app.MapGet("/api/orders/{id}", (int id) =>
    orders.TryGetValue(id, out var order)
        ? Results.Ok(order)
        : Results.Problem(
            detail: $"Order with id {id} not found",
            title: "Not Found",
            statusCode: StatusCodes.Status404NotFound,
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.4"
        ));

app.Run();
