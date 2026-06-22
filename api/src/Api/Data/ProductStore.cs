using System.Collections.Concurrent;
using Api.Models;

namespace Api.Data;

public class ProductStore
{
    private readonly ConcurrentDictionary<int, Product> _products;
    private int _nextId = 4;

    public ProductStore()
    {
        _products = new ConcurrentDictionary<int, Product>(new List<Product>
        {
            new(1, "Laptop", "High-performance laptop", 999.99m, "Electronics", "https://placehold.co/400x300/3b82f6/white?text=Laptop", new ProductRating(4.5, 120)),
            new(2, "Mouse", "Wireless ergonomic mouse", 29.99m, "Electronics", "https://placehold.co/400x300/ef4444/white?text=Mouse", new ProductRating(4.2, 85)),
            new(3, "Keyboard", "Mechanical keyboard", 79.99m, "Electronics", "https://placehold.co/400x300/22c55e/white?text=Keyboard", new ProductRating(4.7, 200))
        }.ToDictionary(p => p.Id, p => p));
    }

    public List<Product> GetAll() => _products.Values.ToList();

    public bool TryGet(int id, out Product? product) => _products.TryGetValue(id, out product);

    public Product Add(Product product)
    {
        var newProduct = product with { Id = Interlocked.Increment(ref _nextId) };
        _products.TryAdd(newProduct.Id, newProduct);
        return newProduct;
    }

    public bool Update(int id, Product product)
    {
        if (!_products.ContainsKey(id)) return false;
        _products[id] = product with { Id = id };
        return true;
    }

    public bool Remove(int id) => _products.TryRemove(id, out _);
}
