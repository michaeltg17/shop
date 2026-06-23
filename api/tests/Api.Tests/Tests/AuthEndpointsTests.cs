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

public class AuthEndpointsTests : IAsyncDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public AuthEndpointsTests()
    {
        _factory = new WebApplicationFactory<Program>();
        TestBase.Migrate(_factory);
        _client = _factory.CreateClient();
    }

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

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.BadRequest);
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

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.BadRequest);
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

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.BadRequest);
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
    public async Task Login_InvalidCredentials_ReturnsProblemDetails401()
    {
        var loginReq = new { Username = "nonexistent", Password = "wrongpassword" };
        var loginContent = new StringContent(
            JsonSerializer.Serialize(loginReq),
            Encoding.UTF8,
            "application/json");
        var response = await _client.PostAsync("/api/auth/login", loginContent);

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.Unauthorized);
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}
