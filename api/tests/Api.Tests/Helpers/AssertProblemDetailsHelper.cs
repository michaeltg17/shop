using System.Net;
using System.Text.Json;
using Xunit;

namespace Api.Tests.Helpers;

public static class AssertProblemDetailsHelper
{
    public static async Task AssertProblemDetailsAsync(HttpResponseMessage response, HttpStatusCode expectedStatus)
    {
        Assert.Equal(expectedStatus, response.StatusCode);

        var ct = response.Content.Headers.ContentType;
        Assert.NotNull(ct);
        Assert.Contains(ct!.MediaType!, new[] { "application/problem+json", "application/json" });

        var body = await response.Content.ReadAsStringAsync();
        var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("type", out _));
        Assert.True(root.TryGetProperty("title", out _));
        Assert.True(root.TryGetProperty("status", out var status));

        Assert.Equal((int)expectedStatus, status.GetInt32());
    }
}
