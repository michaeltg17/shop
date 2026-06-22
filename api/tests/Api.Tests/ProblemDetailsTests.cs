using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Api.Tests;

public class ProblemDetailsTests : IAsyncDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private string _authToken = "";
    private bool _authenticated = false;

    public ProblemDetailsTests()
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
    }

    private void EnsureAuthenticated()
    {
        if (_authenticated) return;

        var registerReq = new { Username = "testuser", Email = "test@shop.com", Password = "password123" };
        var registerContent = new StringContent(
            JsonSerializer.Serialize(registerReq),
            Encoding.UTF8,
            "application/json");
        _client.PostAsync("/api/auth/register", registerContent).GetAwaiter().GetResult();

        var loginReq = new { Username = "testuser", Password = "password123" };
        var loginContent = new StringContent(
            JsonSerializer.Serialize(loginReq),
            Encoding.UTF8,
            "application/json");
        var loginResponse = _client.PostAsync("/api/auth/login", loginContent).GetAwaiter().GetResult();
        var loginBody = loginResponse.Content.ReadFromJsonAsync<AuthResponse>().GetAwaiter().GetResult();
        _authToken = loginBody!.Token;
        _authenticated = true;
    }

    private HttpClient CreateAuthClient()
    {
        var c = _factory.CreateClient();
        c.DefaultRequestHeaders.Add("Authorization", $"Bearer {_authToken}");
        return c;
    }

    // ── ProblemDetails helper ──

    private async Task<(bool ValidProblemDetails, string Content)> AssertProblemDetailsAsync(HttpResponseMessage response, HttpStatusCode expectedStatus)
    {
        response.StatusCode.Should().Be(expectedStatus);

        var ct = response.Content.Headers.ContentType;
        ct.Should().NotBeNull();
        // ASP.NET Core's Results.Problem() returns application/problem+json or application/json
        ct!.MediaType.Should().BeOneOf("application/problem+json", "application/json");

        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        root.TryGetProperty("type", out var type).Should().BeTrue();
        root.TryGetProperty("title", out var title).Should().BeTrue();
        root.TryGetProperty("status", out var status).Should().BeTrue();

        status.GetInt32().Should().Be((int)expectedStatus);
        title.GetString()!.Should().NotBeNullOrEmpty();
        type.GetString()!.Should().NotBeNullOrEmpty();

        return (true, body);
    }

    // ═══════════════════════════════════════════════════════════
    // Auth error paths
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task Register_DuplicateUsername_ReturnsProblemDetails400()
    {
        var req = new { Username = "pduser1", Email = "pd1@shop.com", Password = "password123" };
        var content = new StringContent(
            JsonSerializer.Serialize(req),
            Encoding.UTF8,
            "application/json");
        await _client.PostAsync("/api/auth/register", content);

        var req2 = new { Username = "pduser1", Email = "pd2@shop.com", Password = "password123" };
        var content2 = new StringContent(
            JsonSerializer.Serialize(req2),
            Encoding.UTF8,
            "application/json");
        var response = await _client.PostAsync("/api/auth/register", content2);

        await AssertProblemDetailsAsync(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsProblemDetails400()
    {
        var req = new { Username = "pduser2", Email = "pdemail@shop.com", Password = "password123" };
        var content = new StringContent(
            JsonSerializer.Serialize(req),
            Encoding.UTF8,
            "application/json");
        await _client.PostAsync("/api/auth/register", content);

        var req2 = new { Username = "pduser3", Email = "pdemail@shop.com", Password = "password123" };
        var content2 = new StringContent(
            JsonSerializer.Serialize(req2),
            Encoding.UTF8,
            "application/json");
        var response = await _client.PostAsync("/api/auth/register", content2);

        await AssertProblemDetailsAsync(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_ShortPassword_ReturnsProblemDetails400()
    {
        var req = new { Username = "pduser4", Email = "pd4@shop.com", Password = "short" };
        var content = new StringContent(
            JsonSerializer.Serialize(req),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PostAsync("/api/auth/register", content);

        await AssertProblemDetailsAsync(response, HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsProblemDetails401()
    {
        var loginReq = new { Username = "nonexistent", Password = "wrongpassword" };
        var loginContent = new StringContent(
            JsonSerializer.Serialize(loginReq),
            Encoding.UTF8,
            "application/json");
        var response = await _client.PostAsync("/api/auth/login", loginContent);

        await AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    // ═══════════════════════════════════════════════════════════
    // Product error paths (auth + not found)
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task CreateProduct_WithoutAuth_ReturnsProblemDetails401()
    {
        var product = new Product(0, "Monitor", "4K Display", 399.99m);
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PostAsync("/api/products", content);

        await AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateProduct_WithoutAuth_ReturnsProblemDetails401()
    {
        var product = new Product(0, "Monitor", "4K Display", 399.99m);
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PutAsync("/api/products/1", content);

        await AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteProduct_WithoutAuth_ReturnsProblemDetails401()
    {
        var response = await _client.DeleteAsync("/api/products/1");

        await AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetProduct_NotFound_ReturnsProblemDetails404()
    {
        var response = await _client.GetAsync("/api/products/999");

        await AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task UpdateProduct_NotFound_ReturnsProblemDetails404()
    {
        EnsureAuthenticated();
        var authClient = CreateAuthClient();
        var product = new Product(0, "Monitor", "4K Display", 399.99m);
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await authClient.PutAsync("/api/products/999", content);

        await AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
        authClient.Dispose();
    }

    [Fact]
    public async Task DeleteProduct_NotFound_ReturnsProblemDetails404()
    {
        EnsureAuthenticated();
        var authClient = CreateAuthClient();
        var response = await authClient.DeleteAsync("/api/products/999");

        await AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
        authClient.Dispose();
    }

    // ═══════════════════════════════════════════════════════════
    // Order error paths
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task GetOrder_NotFound_ReturnsProblemDetails404()
    {
        var response = await _client.GetAsync("/api/orders/999");

        await AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
    }

    // ═══════════════════════════════════════════════════════════
    // User error paths
    // ═══════════════════════════════════════════════════════════

    [Fact]
    public async Task UpdateUser_NotFound_ReturnsProblemDetails404()
    {
        var user = new AdminUser(999, "Nobody", "Here", "nobody@nowhere.com", "", false);
        var content = new StringContent(
            JsonSerializer.Serialize(user),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PutAsync("/api/users/999", content);

        await AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}
