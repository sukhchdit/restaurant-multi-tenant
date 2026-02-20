using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.Application.DTOs.Order;
using RestaurantManagement.Application.DTOs.Report;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/orders")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ICurrentUserService _currentUser;
    private readonly IHubContext<OrderHub> _orderHub;
    private readonly IHubContext<KitchenHub> _kitchenHub;
    private readonly INotificationService _notificationService;
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly IBillingService _billingService;
    private readonly ILogger<OrderController> _logger;

    public OrderController(
        IOrderService orderService,
        ICurrentUserService currentUser,
        IHubContext<OrderHub> orderHub,
        IHubContext<KitchenHub> kitchenHub,
        INotificationService notificationService,
        IHubContext<NotificationHub> notificationHub,
        IBillingService billingService,
        ILogger<OrderController> logger)
    {
        _orderService = orderService;
        _currentUser = currentUser;
        _orderHub = orderHub;
        _kitchenHub = kitchenHub;
        _notificationService = notificationService;
        _notificationHub = notificationHub;
        _billingService = billingService;
        _logger = logger;
    }

    [HttpGet]
    [Authorize(Policy = Permissions.OrderView)]
    [ProducesResponseType(typeof(ApiResponse<List<OrderDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrders(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] OrderType? orderType = null,
        [FromQuery] string? search = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _orderService.GetOrdersAsync(pageNumber, pageSize, status, orderType, search, fromDate, toDate, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = Permissions.OrderView)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _orderService.GetOrderByIdAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.OrderCreate)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.CreateOrderAsync(dto, cancellationToken);
        if (result.Success && result.Data != null)
        {
            var tenantId = _currentUser.TenantId;
            if (tenantId != null)
            {
                await _orderHub.Clients.Group($"tenant_{tenantId}")
                    .SendAsync("OrderCreated", new { orderId = result.Data.Id });
                await _kitchenHub.Clients.Group($"kitchen_{tenantId}")
                    .SendAsync("NewKOT", new { orderId = result.Data.Id });

                var notification = await _notificationService.CreateForTenantUsersAsync(
                    $"New Order #{result.Data.OrderNumber}",
                    $"{result.Data.OrderType} - {result.Data.Items.Count} item(s)" +
                        (result.Data.TableNumber != null ? $" - Table {result.Data.TableNumber}" : ""),
                    NotificationType.OrderPlaced,
                    result.Data.Id, cancellationToken);

                if (notification != null)
                {
                    await _notificationHub.Clients.Group($"notifications_{tenantId}")
                        .SendAsync("NewNotification", new
                        {
                            title = notification.Title,
                            message = notification.Message,
                            type = "order-placed",
                            referenceId = notification.ReferenceId,
                            createdBy = _currentUser.UserId
                        });
                    await _orderHub.Clients.Group($"tenant_{tenantId}")
                        .SendAsync("NotificationUpdated", new { });
                }
            }
        }
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.OrderUpdate)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOrder(Guid id, [FromBody] UpdateOrderDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.UpdateOrderAsync(id, dto, cancellationToken);
        if (result.Success && result.Data != null)
        {
            var tenantId = _currentUser.TenantId;
            if (tenantId != null)
            {
                await _orderHub.Clients.Group($"tenant_{tenantId}")
                    .SendAsync("OrderUpdated", new { orderId = result.Data.Id });

                if (result.Message?.Contains("New KOT") == true)
                {
                    await _kitchenHub.Clients.Group($"kitchen_{tenantId}")
                        .SendAsync("NewKOT", new { orderId = result.Data.Id });
                }
                else
                {
                    await _kitchenHub.Clients.Group($"kitchen_{tenantId}")
                        .SendAsync("KOTUpdated", new { orderId = result.Data.Id });
                }
            }
        }
        return StatusCode(result.StatusCode, result);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = Permissions.OrderUpdate)]
    [ProducesResponseType(typeof(ApiResponse<OrderDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusDto dto, CancellationToken cancellationToken)
    {
        var result = await _orderService.UpdateOrderStatusAsync(id, dto, cancellationToken);
        if (result.Success && result.Data != null)
        {
            var tenantId = _currentUser.TenantId;
            if (tenantId != null)
            {
                await _orderHub.Clients.Group($"tenant_{tenantId}")
                    .SendAsync("OrderStatusChanged", new { orderId = result.Data.Id, status = result.Data.Status });
                await _kitchenHub.Clients.Group($"kitchen_{tenantId}")
                    .SendAsync("KOTUpdated", new { orderId = result.Data.Id });

                // Broadcast inventory update when stock is deducted (Confirmed, or Preparing from Pending)
                if (dto.Status == OrderStatus.Confirmed || dto.Status == OrderStatus.Preparing)
                {
                    await _orderHub.Clients.Group($"tenant_{tenantId}")
                        .SendAsync("InventoryUpdated", new { orderId = result.Data.Id });
                }

                // Auto-generate invoice when order is served or completed
                if (result.Data.Status == OrderStatus.Served || result.Data.Status == OrderStatus.Completed)
                {
                    try
                    {
                        var invoiceResult = await _billingService.GenerateInvoiceAsync(id, cancellationToken);
                        if (invoiceResult.Success)
                        {
                            _logger.LogInformation("Auto-generated invoice for order {OrderId} on status {Status}", id, result.Data.Status);
                            await _orderHub.Clients.Group($"tenant_{tenantId}")
                                .SendAsync("BillingUpdated", new { });
                        }
                        else
                        {
                            _logger.LogWarning("Auto-invoice returned failure for order {OrderId}: {Message}", id, invoiceResult.Message);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Auto-invoice failed for order {OrderId} on status {Status}", id, result.Data.Status);
                    }
                }
            }
        }
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Policy = Permissions.OrderCancel)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CancelOrder(Guid id, [FromQuery] string? reason, CancellationToken cancellationToken)
    {
        var result = await _orderService.CancelOrderAsync(id, reason, cancellationToken);
        if (result.Success)
        {
            var tenantId = _currentUser.TenantId;
            if (tenantId != null)
            {
                await _orderHub.Clients.Group($"tenant_{tenantId}")
                    .SendAsync("OrderStatusChanged", new { orderId = id, status = "cancelled" });
                await _kitchenHub.Clients.Group($"kitchen_{tenantId}")
                    .SendAsync("KOTUpdated", new { orderId = id });
            }
        }
        return StatusCode(result.StatusCode, result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = Permissions.OrderDelete)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteOrder(Guid id, [FromQuery] string? reason, CancellationToken cancellationToken)
    {
        var result = await _orderService.DeleteOrderAsync(id, reason, cancellationToken);
        if (result.Success)
        {
            var tenantId = _currentUser.TenantId;
            if (tenantId != null)
            {
                await _orderHub.Clients.Group($"tenant_{tenantId}")
                    .SendAsync("OrderDeleted", new { orderId = id });
                await _kitchenHub.Clients.Group($"kitchen_{tenantId}")
                    .SendAsync("KOTUpdated", new { orderId = id });
            }
        }
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("dashboard-stats")]
    [Authorize(Policy = Permissions.OrderView)]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken cancellationToken)
    {
        var result = await _orderService.GetDashboardStatsAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
