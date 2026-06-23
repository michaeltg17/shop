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

public class OrdersEndpointsTests : IAsyncDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public OrdersEndpointsTests()
    {
        _factory = new WebApplicationFactory<Program>();
        TestBase.Migrate(_factory);
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task CreateOrder_ReturnsCreatedOrder()
    {
        var orderRequest = new OrderRequest(
            Items: new List<OrderItemRequest>
            {
                new OrderItemRequest(1, "Laptop", 999.99m, 1),
                new OrderItemRequest(2, "Mouse", 29.99m, 2)
            },
            Shipping: 5.99m
        );

        var content = new StringContent(
            JsonSerializer.Serialize(orderRequest),
            Encoding.UTF8,
            "application/json");

        var response = await _client.PostAsync("/api/orders", content);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<Order>();
        body!.Should().NotBeNull();
        body!.Id.Should().BeGreaterThan(0);
        body!.Items.Should().HaveCount(2);
        body!.Status.Should().Be("pending");
        body!.Total.Should().Be(1059.97m);
    }

    [Fact]
    public async Task GetOrders_ReturnsAllOrders()
    {
        var orderRequest = new OrderRequest(
            Items: new List<OrderItemRequest>
            {
                new OrderItemRequest(3, "Keyboard", 79.99m, 1)
            },
            Shipping: 5.99m
        );
        var content = new StringContent(
            JsonSerializer.Serialize(orderRequest),
            Encoding.UTF8,
            "application/json");
        await _client.PostAsync("/api/orders", content);

        var response = await _client.GetAsync("/api/orders");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var bodies = await response.Content.ReadFromJsonAsync<List<Order>>();
        bodies.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetOrderById_WhenExists_ReturnsOrder()
    {
        var orderRequest = new OrderRequest(
            Items: new List<OrderItemRequest>
            {
                new OrderItemRequest(1, "Laptop", 999.99m, 1)
            },
            Shipping: 5.99m
        );
        var content = new StringContent(
            JsonSerializer.Serialize(orderRequest),
            Encoding.UTF8,
            "application/json");
        var createResponse = await _client.PostAsync("/api/orders", content);
        var createdOrder = await createResponse.Content.ReadFromJsonAsync<Order>();

        var response = await _client.GetAsync($"/api/orders/{createdOrder!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<Order>();
        body!.Id.Should().Be(createdOrder.Id);
    }

    [Fact]
    public async Task GetOrderById_WhenNotExists_ReturnsProblemDetails404()
    {
        var response = await _client.GetAsync("/api/orders/999");

        await AssertProblemDetailsHelper.AssertProblemDetailsAsync(response, HttpStatusCode.NotFound);
    }

    public async ValueTask DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }
}