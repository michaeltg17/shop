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

public class UsersEndpointsTests : IAsyncDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public UsersEndpointsTests()
    {
        _factory = new WebApplicationFactory<Program>();
        TestBase.Migrate(_factory);
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GetUsers_ReturnsAllUsers()
    {
        var response = await _client.GetAsync("/api/users");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var bodies = await response.Content.ReadFromJsonAsync<List<AdminUser>>();
        bodies!.Should().HaveCount(3);
    }

    [Fact]
    public async Task CreateUser_ReturnsCreatedUser()
    {
        var user = new AdminUser { FirstName = "Alice", LastName = "Smith", Email = "alice@shop.com", PhoneNumber = "+1-555-0200", IsActive = true };
        var content = new StringContent(
            JsonSerializer.Serialize(user),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PostAsync("/api/users", content);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<AdminUser>();
        body!.Should().NotBeNull();
        body!.Id.Should().BeGreaterThan(3);
        body!.FirstName.Should().Be("Alice");
    }

    [Fact]
    public async Task UpdateUser_WhenExists_ReturnsUpdatedUser()
    {
        var user = new AdminUser { Id = 1, FirstName = "Michael", LastName = "Updated", Email = "michael@updated.com", PhoneNumber = "+1-555-9999", IsActive = true };
        var content = new StringContent(
            JsonSerializer.Serialize(user),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PutAsync("/api/users/1", content);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<AdminUser>();
        body!.Should().NotBeNull();
        body!.Id.Should().Be(1);
        body!.LastName.Should().Be("Updated");
    }

    [Fact]
    public async Task UpdateUser_WhenNotExists_ReturnsProblemDetails404()
    {
        var user = new AdminUser { FirstName = "Nobody", LastName = "Here", Email = "nobody@nowhere.com", PhoneNumber = "", IsActive = false };
        var content = new StringContent(
            JsonSerializer.Serialize(user),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PutAsync("/api/users/999", content);

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteUsers_Bulk_RemovesSpecifiedUsers()
    {
        var ids = new List<int> { 1, 2 };
        var content = new StringContent(
            JsonSerializer.Serialize(ids),
            Encoding.UTF8,
            "application/json");

        var request = new HttpRequestMessage(HttpMethod.Delete, "/api/users")
        {
            Content = content
        };
        var response = await _client.SendAsync(request);
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var getUsersResponse = await _client.GetAsync("/api/users");
        var remainingUsers = await getUsersResponse.Content.ReadFromJsonAsync<List<AdminUser>>();
        remainingUsers!.Should().HaveCount(1);
        remainingUsers[0].Id.Should().Be(3);
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}