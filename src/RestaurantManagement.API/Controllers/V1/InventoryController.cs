using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.Application.DTOs.Inventory;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly IHubContext<OrderHub> _orderHub;

    public InventoryController(IInventoryService inventoryService, IHubContext<OrderHub> orderHub)
    {
        _inventoryService = inventoryService;
        _orderHub = orderHub;
    }

    private async Task BroadcastAsync(string eventName)
    {
        var tenantId = User.FindFirst("tenantId")?.Value;
        if (!string.IsNullOrEmpty(tenantId))
            await _orderHub.Clients.Group($"tenant_{tenantId}").SendAsync(eventName);
    }

    [HttpGet]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(ApiResponse<List<InventoryItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetItems(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] Guid? categoryId = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _inventoryService.GetItemsAsync(pageNumber, pageSize, search, categoryId, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.InventoryCreate)]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateItem([FromBody] CreateInventoryItemDto dto, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.CreateItemAsync(dto, cancellationToken);
        if (result.Success) await BroadcastAsync("InventoryUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Permissions.InventoryUpdate)]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] CreateInventoryItemDto dto, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.UpdateItemAsync(id, dto, cancellationToken);
        if (result.Success) await BroadcastAsync("InventoryUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpPost("{id:guid}/restock")]
    [Authorize(Policy = Permissions.InventoryUpdate)]
    [ProducesResponseType(typeof(ApiResponse<InventoryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Restock(Guid id, [FromBody] RestockDto dto, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.RestockAsync(id, dto, cancellationToken);
        if (result.Success) await BroadcastAsync("InventoryUpdated");
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("{id:guid}/movements")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(ApiResponse<List<StockMovementDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMovements(Guid id, CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetMovementsAsync(id, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("low-stock")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(ApiResponse<List<InventoryItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStock(CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetLowStockAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
