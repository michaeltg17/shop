using System.Text;
using Api.Data;
using Api.Endpoints.AuthEndpoints;
using Api.Endpoints.OrdersEndpoints;
using Api.Endpoints.ProductsEndpoints;
using Api.Endpoints.UsersEndpoints;
using Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

// DB + Identity
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddIdentity<IdentityUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    options.Password.RequiredUniqueChars = 1;

    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();

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

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("Admin", policy => policy.RequireRole("Admin"));

var app = builder.Build();

app.MapOpenApi();

app.UseAuthentication();
app.UseAuthorization();

// Create roles at startup
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    await roleManager.CreateAsync(new IdentityRole("Customer"));
    await roleManager.CreateAsync(new IdentityRole("Admin"));
}

// Map endpoints
app.MapRegisterEndpoint();
app.MapLoginEndpoint();
app.MapLogin2faEndpoint();
app.MapTwoFaEndpoints();
app.MapEmailConfirmationEndpoints();
app.MapPasswordResetEndpoints();
app.MapProfileEndpoints();
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
