using Api.Data;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Api.Tests.Helpers;

public static class TestBase
{
    public static WebApplicationFactory<Program> CreateFactory()
    {
        return new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration(config =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string>
                    {
                        { "Testing:UseInMemoryDatabase", "true" },
                    });
                });
            });
    }

    // Kept for backwards compatibility with existing test constructors
    public static void Migrate(WebApplicationFactory<Program> factory) { /* no-op with InMemory */ }
}
