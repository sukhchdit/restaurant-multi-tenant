using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.Application.DTOs.KOT;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class KOTController : ControllerBase
{
    private readonly IKOTService _kotService;
    private readonly ICurrentUserService _currentUser;
    private readonly IHubContext<KitchenHub> _kitchenHub;
    private readonly IHubContext<OrderHub> _orderHub;
    private readonly INotificationService _notificationService;
    private readonly IHubContext<NotificationHub> _notificationHub;

    public KOTController(
        IKOTService kotService,
        ICurrentUserService currentUser,
        IHubContext<KitchenHub> kitchenHub,
        IHubContext<OrderHub> orderHub,
        INotificationService notificationService,
        IHubContext<NotificationHub> notificationHub)
    {
        _kotService = kotService;
        _currentUser = currentUser;
        _kitchenHub = kitchenHub;
        _orderHub = orderHub;
        _notificationService = notificationService;
        _notificationHub = notificationHub;
    }

    [HttpGet]
    [Authorize(Policy = Permissions.KotView)]
    [ProducesResponseType(typeof(ApiResponse<List<KOTDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveKOTs(CancellationToken cancellationToken)
    {
        var result = await _kotService.GetActiveKOTsAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/acknowledge")]
    [Authorize(Policy = Permissions.KotUpdate)]
    [ProducesResponseType(typeof(ApiResponse<KOTDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Acknowledge(Guid id, CancellationToken cancellationToken)
    {
        var result = await _kotService.AcknowledgeAsync(id, cancellationToken);
        if (result.Success)
            await BroadcastKOTUpdate(result.Data!);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/start-preparing")]
    [Authorize(Policy = Permissions.KotUpdate)]
    [ProducesResponseType(typeof(ApiResponse<KOTDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartPreparing(Guid id, CancellationToken cancellationToken)
    {
        var result = await _kotService.StartPreparingAsync(id, cancellationToken);
        if (result.Success)
        {
            await BroadcastKOTUpdate(result.Data!);
            await BroadcastNotification(
                $"KOT #{result.Data!.KOTNumber} Preparing",
                $"Order #{result.Data.OrderNumber} is being prepared",
                NotificationType.KOTCreated, result.Data.OrderId, cancellationToken);
        }
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/mark-ready")]
    [Authorize(Policy = Permissions.KotUpdate)]
    [ProducesResponseType(typeof(ApiResponse<KOTDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkReady(Guid id, CancellationToken cancellationToken)
    {
        var result = await _kotService.MarkReadyAsync(id, cancellationToken);
        if (result.Success)
        {
            await BroadcastKOTUpdate(result.Data!);
            await BroadcastNotification(
                $"KOT #{result.Data!.KOTNumber} Ready!",
                $"Order #{result.Data.OrderNumber} is ready for serving",
                NotificationType.OrderReady, result.Data.OrderId, cancellationToken);
        }
        return StatusCode(result.StatusCode, result);
    }

    private async Task BroadcastKOTUpdate(KOTDto kot)
    {
        var tenantId = _currentUser.TenantId;
        if (tenantId == null) return;

        var kitchenGroup = $"kitchen_{tenantId}";
        var orderGroup = $"tenant_{tenantId}";

        await _kitchenHub.Clients.Group(kitchenGroup)
            .SendAsync("KOTUpdated", new { kotId = kot.Id });

        await _orderHub.Clients.Group(orderGroup)
            .SendAsync("OrderStatusChanged", new { orderId = kot.OrderId, status = kot.Status });
    }

    private async Task BroadcastNotification(
        string title, string message, NotificationType type, Guid? referenceId,
        CancellationToken cancellationToken)
    {
        var tenantId = _currentUser.TenantId;
        if (tenantId == null) return;

        var notification = await _notificationService.CreateForTenantUsersAsync(
            title, message, type, referenceId, cancellationToken);

        if (notification != null)
        {
            await _notificationHub.Clients.Group($"notifications_{tenantId}")
                .SendAsync("NewNotification", new
                {
                    title = notification.Title,
                    message = notification.Message,
                    type = type switch
                    {
                        NotificationType.KOTCreated => "kot-created",
                        NotificationType.OrderReady => "order-ready",
                        _ => "system"
                    },
                    referenceId = notification.ReferenceId,
                    createdBy = _currentUser.UserId
                });
            await _orderHub.Clients.Group($"tenant_{tenantId}")
                .SendAsync("NotificationUpdated", new { });
        }
    }
}
