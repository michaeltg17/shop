using System.Collections.Concurrent;
using Api.Models;

namespace Api.Data;

public class UserStore
{
    private readonly ConcurrentDictionary<int, AdminUser> _users;
    private int _nextId = 4;

    public UserStore()
    {
        _users = new ConcurrentDictionary<int, AdminUser>(new List<AdminUser>
        {
            new(1, "Michael", "Garcia", "michael@example.com", "+1-555-0101", true),
            new(2, "Sarah", "Johnson", "sarah@example.com", "+1-555-0102", true),
            new(3, "James", "Wilson", "james@example.com", "+1-555-0103", false)
        }.ToDictionary(u => u.Id, u => u));
    }

    public List<AdminUser> GetAll() => _users.Values.ToList();

    public bool TryGet(int id, out AdminUser? user) => _users.TryGetValue(id, out user);

    public AdminUser Add(AdminUser user)
    {
        var newUser = user with { Id = Interlocked.Increment(ref _nextId) };
        _users.TryAdd(newUser.Id, newUser);
        return newUser;
    }

    public bool Update(int id, AdminUser user)
    {
        if (!_users.ContainsKey(id)) return false;
        _users[id] = user with { Id = id };
        return true;
    }

    public void RemoveRange(List<int> ids)
    {
        foreach (var id in ids)
        {
            _users.TryRemove(id, out _);
        }
    }
}
