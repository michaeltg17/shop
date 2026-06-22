using System.Text;
using Api.Data;
using Api.Endpoints.AuthEndpoints;
using Api.Endpoints.OrdersEndpoints;
using Api.Endpoints.ProductsEndpoints;
using Api.Endpoints.UsersEndpoints;
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

// Register services
builder.Services.AddSingleton<IAuthService, AuthService>();
builder.Services.AddSingleton<ProductStore>();
builder.Services.AddSingleton<UserStore>();
builder.Services.AddSingleton<OrderStore>();

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

// Map endpoints
app.MapRegisterEndpoint();
app.MapLoginEndpoint();
app.MapGetProductsEndpoint();
app.MapGetProductEndpoint();
app.MapCreateProductEndpoint();
app.MapUpdateProductEndpoint();
app.MapDeleteProductEndpoint();
app.MapGetUsersEndpoint();
app.MapCreateUserEndpoint();
app.MapUpdateUserEndpoint();
app.MapDeleteUsersEndpoint();
app.MapGetOrdersEndpoint();
app.MapGetOrderEndpoint();
app.MapCreateOrderEndpoint();

app.Run();
