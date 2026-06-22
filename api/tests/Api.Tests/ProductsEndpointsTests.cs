using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Api.Tests;

public class ProductsEndpointsTests : IAsyncDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private string _authToken;
    private bool _authenticated = false;

    public ProductsEndpointsTests()
    {
        _factory = new WebApplicationFactory<Program>();
        _client = _factory.CreateClient();
    }

    private void EnsureAuthenticated()
    {
        if (_authenticated) return;

        // Register a fresh user in this factory instance
        var registerReq = new { Username = "testuser", Email = "test@shop.com", Password = "password123" };
        var registerContent = new StringContent(
            JsonSerializer.Serialize(registerReq),
            Encoding.UTF8,
            "application/json");
        _client.PostAsync("/api/auth/register", registerContent).GetAwaiter().GetResult();

        // Login
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

    [Fact]
    public async Task GetProducts_ReturnsAllProducts()
    {
        var response = await _client.GetAsync("/api/products");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var bodies = await response.Content.ReadFromJsonAsync<List<Product>>();
        bodies!.Should().HaveCount(3);
    }

    [Fact]
    public async Task GetProductById_WhenExists_ReturnsProduct()
    {
        var response = await _client.GetAsync("/api/products/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<Product>();
        body!.Should().NotBeNull();
        body!.Id.Should().Be(1);
    }

    [Fact]
    public async Task GetProductById_WhenNotExists_ReturnsNotFound()
    {
        var response = await _client.GetAsync("/api/products/999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateProduct_WithAuth_ReturnsCreatedProduct()
    {
        EnsureAuthenticated();
        var authClient = CreateAuthClient();
        var product = new Product(0, "Monitor", "4K Display", 399.99m);
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await authClient.PostAsync("/api/products", content);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<Product>();
        body!.Should().NotBeNull();
        body!.Id.Should().BeGreaterThan(0);
        body!.Name.Should().Be("Monitor");
        authClient.Dispose();
    }

    [Fact]
    public async Task CreateProduct_WithoutAuth_ReturnsUnauthorized()
    {
        var product = new Product(0, "Monitor", "4K Display", 399.99m);
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PostAsync("/api/products", content);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateProduct_WithAuth_WhenExists_ReturnsUpdatedProduct()
    {
        EnsureAuthenticated();
        var authClient = CreateAuthClient();
        var product = new Product(0, "Updated Laptop", "Updated description", 1099.99m);
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await authClient.PutAsync("/api/products/1", content);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<Product>();
        body!.Should().NotBeNull();
        body!.Id.Should().Be(1);
        body!.Name.Should().Be("Updated Laptop");
        authClient.Dispose();
    }

    [Fact]
    public async Task UpdateProduct_WithoutAuth_ReturnsUnauthorized()
    {
        var product = new Product(0, "New Product", "Description", 9.99m);
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PutAsync("/api/products/999", content);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteProduct_WithAuth_WhenExists_ReturnsNoContent()
    {
        EnsureAuthenticated();
        var authClient = CreateAuthClient();
        var response = await authClient.DeleteAsync("/api/products/2");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        authClient.Dispose();
    }

    [Fact]
    public async Task DeleteProduct_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.DeleteAsync("/api/products/3");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    // ── Auth endpoint tests ──

    [Fact]
    public async Task Register_ReturnsTokenOnSuccess()
    {
        var req = new { Username = "newuser1", Email = "new1@shop.com", Password = "password123" };
        var content = new StringContent(
            JsonSerializer.Serialize(req),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PostAsync("/api/auth/register", content);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        body!.Should().NotBeNull();
        body!.Token.Should().NotBeNullOrEmpty();
        body!.Username.Should().Be("newuser1");
        body!.Email.Should().Be("new1@shop.com");
    }

    [Fact]
    public async Task Register_FailsOnDuplicateUsername()
    {
        var req = new { Username = "dupuser1", Email = "dup1@shop.com", Password = "password123" };
        var content = new StringContent(
            JsonSerializer.Serialize(req),
            Encoding.UTF8,
            "application/json");
        await _client.PostAsync("/api/auth/register", content);

        var req2 = new { Username = "dupuser1", Email = "dup2@shop.com", Password = "password123" };
        var content2 = new StringContent(
            JsonSerializer.Serialize(req2),
            Encoding.UTF8,
            "application/json");
        var response = await _client.PostAsync("/api/auth/register", content2);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_FailsOnDuplicateEmail()
    {
        var req = new { Username = "emailuser1", Email = "dupemail@shop.com", Password = "password123" };
        var content = new StringContent(
            JsonSerializer.Serialize(req),
            Encoding.UTF8,
            "application/json");
        await _client.PostAsync("/api/auth/register", content);

        var req2 = new { Username = "emailuser2", Email = "dupemail@shop.com", Password = "password123" };
        var content2 = new StringContent(
            JsonSerializer.Serialize(req2),
            Encoding.UTF8,
            "application/json");
        var response = await _client.PostAsync("/api/auth/register", content2);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_ReturnsTokenWithValidCredentials()
    {
        var req = new { Username = "loginuser1", Email = "login1@shop.com", Password = "password123" };
        var content = new StringContent(
            JsonSerializer.Serialize(req),
            Encoding.UTF8,
            "application/json");
        await _client.PostAsync("/api/auth/register", content);

        var loginReq = new { Username = "loginuser1", Password = "password123" };
        var loginContent = new StringContent(
            JsonSerializer.Serialize(loginReq),
            Encoding.UTF8,
            "application/json");
        var response = await _client.PostAsync("/api/auth/login", loginContent);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<AuthResponse>();
        body!.Should().NotBeNull();
        body!.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_ReturnsUnauthorizedWithInvalidCredentials()
    {
        var loginReq = new { Username = "nonexistent", Password = "wrongpassword" };
        var loginContent = new StringContent(
            JsonSerializer.Serialize(loginReq),
            Encoding.UTF8,
            "application/json");
        var response = await _client.PostAsync("/api/auth/login", loginContent);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}
