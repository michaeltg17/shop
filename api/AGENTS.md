# API - .NET 10 Minimal APIs

## Overview

.NET 10 Minimal APIs project with EF Core + PostgreSQL. Auth is handled by a scoped IAuthService service.

## Structure

api/
  src/Api/
    Program.cs           App setup, DbContext, auth config
    Models/              POCOs (Product, Order, User, AdminUser, Auth)
    Services/
      AuthService.cs     JWT + bcrypt + EF queries
    Data/
      AppDbContext.cs    EF Core DbContext + entity configuration
      DatabaseSeeder.cs  Seed data on first startup
      DbExtensions.cs    Auto-migrate + seed helper
      Migrations/        EF Core migrations
  tests/Api.Tests/
    Tests/
      UsersEndpointsTests.cs
      ProductsEndpointsTests.cs
      OrdersEndpointsTests.cs
      AuthEndpointsTests.cs
    Helpers/

## Key Design Decisions

### Minimal APIs

All routes via app.Map*() calls. Auth-protected routes use .RequireAuthorization().

### Authentication

- Users (JWT): AuthService via AppDbContext. Registration: unique username/email, min 8-char password (bcrypt). Login: HMAC-SHA256 JWT.
- JWT: Secret (required), ExpiryHours (default 24). Issuer: shop-api, audience: shop
- Admin Users: separate PostgreSQL table, currently unprotected

### Configuration

- Jwt:Secret (required): HMAC-SHA256 signing key
- Jwt:ExpiryHours (default 24): Token expiry hours
- ConnectionStrings:DefaultConnection (required): PostgreSQL connection string

### Error Responses

All error responses MUST use RFC 7807 ProblemDetails via Results.Problem(). Never return ad-hoc JSON.

Every error response must include: type (URI), title, status (int), detail.

### Database

- PostgreSQL via EF Core. ConnectionStrings:DefaultConnection required
- Scoped AppDbContext. Migrations committed to git, auto-applied via app.InitializeDb()

Unique: Users.Username, Users.Email. Indexed: Products.Category.

## Endpoints

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register (returns JWT) |
| POST | /api/auth/login | No | Login (returns JWT) |

### Products

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/products | No | List all |
| GET | /api/products/{id} | No | Get by ID |
| POST | /api/products | Yes | Create |
| PUT | /api/products/{id} | Yes | Update |
| DELETE | /api/products/{id} | Yes | Delete |

### Users (Admin)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/users | No | List all |
| POST | /api/users | No | Create |
| PUT | /api/users/{id} | No | Update |
| DELETE | /api/users | No | Bulk delete by IDs |

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/orders | No | Create order |
| GET | /api/orders | No | List all (date desc) |
| GET | /api/orders/{id} | No | Get by ID |

## Testing Policy

### Integration Tests Only - No Unit Tests, No Mocks

Hard rule: All API tests must use WebApplicationFactory<Program> with real HTTP.

- WebApplicationFactory<Program> + HttpClient - real requests, middleware, auth
- Register/login via actual endpoints for JWT tokens
- No Moq, NSubstitute, fake mocks, DelegatingHandler fakes

FluentAssertions. xUnit. Each test class gets its own factory instance.

## Commands

dotnet test

dotnet ef migrations add <Name> --project src/Api/Api.csproj --output-dir Data/Migrations
