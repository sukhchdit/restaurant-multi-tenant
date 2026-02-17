using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.Application.DTOs.Notification;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly IHubContext<OrderHub> _orderHub;

    public NotificationController(INotificationService notificationService, IHubContext<OrderHub> orderHub)
    {
        _notificationService = notificationService;
        _orderHub = orderHub;
    }

    private async Task BroadcastAsync(string eventName)
    {
        var tenantId = User.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
            await _orderHub.Clients.Group($"tenant_{tenantId}").SendAsync(eventName);
    }

    [HttpGet]
    [Authorize(Policy = Permissions.NotificationView)]
    [ProducesResponseType(typeof(ApiResponse<List<NotificationDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isRead = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _notificationService.GetNotificationsAsync(pageNumber, pageSize, isRead, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/read")]
    [Authorize(Policy = Permissions.NotificationView)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var result = await _notificationService.MarkAsReadAsync(id, cancellationToken);
        if (result.Success) await BroadcastAsync("NotificationUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("mark-all-read")]
    [Authorize(Policy = Permissions.NotificationView)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead(CancellationToken cancellationToken)
    {
        var result = await _notificationService.MarkAllAsReadAsync(cancellationToken);
        if (result.Success) await BroadcastAsync("NotificationUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("unread-count")]
    [Authorize(Policy = Permissions.NotificationView)]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount(CancellationToken cancellationToken)
    {
        var result = await _notificationService.GetUnreadCountAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Permissions.NotificationView)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var result = await _notificationService.DeleteAsync(id, cancellationToken);
        if (result.Success) await BroadcastAsync("NotificationUpdated");
        return StatusCode(result.StatusCode, result);
    }
}
