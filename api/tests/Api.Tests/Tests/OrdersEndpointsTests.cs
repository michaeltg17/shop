using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Api.Models;
using Api.Tests.Helpers;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Api.Tests;

public class OrdersEndpointsTests : IAsyncDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public OrdersEndpointsTests()
    {
        _factory = TestBase.CreateFactory();
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

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Order>();
        Assert.NotNull(body);
        Assert.True(body!.Id > 0);
        Assert.Equal(2, body!.Items.Count);
        Assert.Equal("pending", body!.Status);
        Assert.Equal(1059.97m, body!.Total);
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

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var bodies = await response.Content.ReadFromJsonAsync<List<Order>>();
        Assert.NotEmpty(bodies!);
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

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Order>();
        Assert.Equal(createdOrder.Id, body!.Id);
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
