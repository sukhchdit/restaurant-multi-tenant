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

    public OrderController(
        IOrderService orderService,
        ICurrentUserService currentUser,
        IHubContext<OrderHub> orderHub,
        IHubContext<KitchenHub> kitchenHub)
    {
        _orderService = orderService;
        _currentUser = currentUser;
        _orderHub = orderHub;
        _kitchenHub = kitchenHub;
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
                await _kitchenHub.Clients.Group($"kitchen_{tenantId}")
                    .SendAsync("KOTUpdated", new { orderId = result.Data.Id });
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
