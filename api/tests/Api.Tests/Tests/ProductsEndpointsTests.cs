using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Api.Models;
using Api.Tests.Helpers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Api.Tests;

public class ProductsEndpointsTests : IAsyncDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ProductsEndpointsTests()
    {
        _factory = new WebApplicationFactory<Program>();
        TestBase.Migrate(_factory);
        _client = _factory.CreateClient();
    }

    private async Task<string> GetAuthTokenAsync()
    {
        var registerReq = new { Username = "authtest", Email = "authtest@shop.com", Password = "password123" };
        var content = new StringContent(
            JsonSerializer.Serialize(registerReq),
            Encoding.UTF8,
            "application/json");
        await _client.PostAsync("/api/auth/register", content);

        var loginReq = new { Username = "authtest", Password = "password123" };
        var loginContent = new StringContent(
            JsonSerializer.Serialize(loginReq),
            Encoding.UTF8,
            "application/json");
        var loginResponse = await _client.PostAsync("/api/auth/login", loginContent);
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();
        return loginBody!.Token;
    }

    private async Task<HttpClient> CreateAuthClientAsync()
    {
        var c = _factory.CreateClient();
        var token = await GetAuthTokenAsync();
        c.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
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
    public async Task GetProductById_WhenNotExists_ReturnsProblemDetails404()
    {
        var response = await _client.GetAsync("/api/products/999");

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateProduct_WithAuth_ReturnsCreatedProduct()
    {
        var authClient = await CreateAuthClientAsync();
        var product = new Product { Name = "Monitor", Description = "4K Display", Price = 399.99m };
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
    public async Task CreateProduct_WithoutAuth_ReturnsProblemDetails401()
    {
        var product = new Product { Name = "Monitor", Description = "4K Display", Price = 399.99m };
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PostAsync("/api/products", content);

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateProduct_WithAuth_WhenExists_ReturnsUpdatedProduct()
    {
        var authClient = await CreateAuthClientAsync();
        var product = new Product { Name = "Updated Laptop", Description = "Updated description", Price = 1099.99m };
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
    public async Task UpdateProduct_WithoutAuth_ReturnsProblemDetails401()
    {
        var product = new Product { Name = "New Product", Description = "Description", Price = 9.99m };
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PutAsync("/api/products/999", content);

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task DeleteProduct_WithAuth_WhenExists_ReturnsNoContent()
    {
        var authClient = await CreateAuthClientAsync();
        var response = await authClient.DeleteAsync("/api/products/2");

        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        authClient.Dispose();
    }

    [Fact]
    public async Task DeleteProduct_WithoutAuth_ReturnsProblemDetails401()
    {
        var response = await _client.DeleteAsync("/api/products/3");

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task UpdateProduct_NotFound_ReturnsProblemDetails404()
    {
        var authClient = await CreateAuthClientAsync();
        var product = new Product { Name = "Monitor", Description = "4K Display", Price = 399.99m };
        var content = new StringContent(
            JsonSerializer.Serialize(product),
            Encoding.UTF8,
            "application/json");

        var response = await authClient.PutAsync("/api/products/999", content);

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
        authClient.Dispose();
    }

    [Fact]
    public async Task DeleteProduct_NotFound_ReturnsProblemDetails404()
    {
        var authClient = await CreateAuthClientAsync();
        var response = await authClient.DeleteAsync("/api/products/999");

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
        authClient.Dispose();
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}