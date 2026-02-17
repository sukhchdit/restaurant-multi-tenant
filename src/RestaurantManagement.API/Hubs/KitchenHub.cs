using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace RestaurantManagement.API.Hubs;

[Authorize]
public class KitchenHub : Hub
{
    private readonly ILogger<KitchenHub> _logger;

    public KitchenHub(ILogger<KitchenHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var tenantId = Context.User?.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"kitchen_{tenantId}");
        }
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var tenantId = Context.User?.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"kitchen_{tenantId}");
        }
        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinKitchenStation(string stationId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"station_{stationId}");
        _logger.LogInformation("Client {ConnectionId} joined kitchen station {StationId}", Context.ConnectionId, stationId);
    }

    public async Task AcknowledgeKOT(string kotId)
    {
        var tenantId = Context.User?.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
        {
            await Clients.Group($"kitchen_{tenantId}").SendAsync("KOTAcknowledged", kotId);
        }
    }
}
