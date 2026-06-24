namespace Api.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public Order? Order { get; set; }
}

public class Order
{
    public int Id { get; set; }
    public int? CustomerId { get; set; }
    public List<OrderItem> Items { get; set; } = new();
    public decimal Total { get; set; }
    public decimal Shipping { get; set; }
    public string Status { get; set; } = "";
    public string ShippingName { get; set; } = "";
    public string ShippingAddressLine1 { get; set; } = "";
    public string ShippingAddressLine2 { get; set; } = "";
    public string ShippingCity { get; set; } = "";
    public string ShippingState { get; set; } = "";
    public string ShippingZip { get; set; } = "";
    public string ShippingCountry { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public record OrderRequest(
    List<OrderItemRequest> Items,
    decimal Shipping,
    int? CustomerId = null,
    string ShippingName = "",
    string ShippingAddressLine1 = "",
    string ShippingAddressLine2 = "",
    string ShippingCity = "",
    string ShippingState = "",
    string ShippingZip = "",
    string ShippingCountry = ""
);

public record OrderItemRequest(
    int ProductId,
    string ProductName,
    decimal Price,
    int Quantity
);
