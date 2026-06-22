using System.Collections.Concurrent;
using Api.Models;

namespace Api.Data;

public class OrderStore
{
    private readonly ConcurrentDictionary<int, Order> _orders;
    private int _nextId = 1;

    public OrderStore()
    {
        _orders = new ConcurrentDictionary<int, Order>();
    }

    public List<Order> GetAll() => _orders.Values.OrderByDescending(o => o.CreatedAt).ToList();

    public bool TryGet(int id, out Order? order) => _orders.TryGetValue(id, out order);

    public Order Add(OrderRequest request)
    {
        var total = request.Items.Sum(i => i.Price * i.Quantity);
        var order = new Order(
            Id: Interlocked.Increment(ref _nextId),
            Items: request.Items,
            Total: total,
            Shipping: request.Shipping,
            Status: "pending",
            CreatedAt: DateTime.UtcNow
        );
        _orders.TryAdd(order.Id, order);
        return order;
    }
}
