using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Inventory;
using RestaurantManagement.Application.DTOs.Report;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IReportService _reportService;
    private readonly IInventoryService _inventoryService;

    public DashboardController(
        IOrderService orderService,
        IReportService reportService,
        IInventoryService inventoryService)
    {
        _orderService = orderService;
        _reportService = reportService;
        _inventoryService = inventoryService;
    }

    [HttpGet("stats")]
    [Authorize(Policy = Permissions.ReportView)]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken cancellationToken)
    {
        var result = await _orderService.GetDashboardStatsAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("revenue-trend")]
    [Authorize(Policy = Permissions.ReportView)]
    [ProducesResponseType(typeof(ApiResponse<List<RevenueChartDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRevenueTrend([FromQuery] int months = 6, CancellationToken cancellationToken = default)
    {
        var result = await _reportService.GetRevenueTrendAsync(months, cancellationToken: cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("category-distribution")]
    [Authorize(Policy = Permissions.ReportView)]
    [ProducesResponseType(typeof(ApiResponse<List<CategoryDistributionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategoryDistribution(CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var from = today.AddMonths(-1);
        var to = today.Add(new TimeSpan(23, 59, 59));
        var result = await _reportService.GetCategoryDistributionAsync(from, to, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("top-items")]
    [Authorize(Policy = Permissions.ReportView)]
    [ProducesResponseType(typeof(ApiResponse<List<TopMenuItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopMenuItems(
        [FromQuery] int count = 10,
        CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var from = today.AddMonths(-1);
        var to = today.Add(new TimeSpan(23, 59, 59));
        var result = await _reportService.GetTopItemsAsync(count, from, to, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("low-stock")]
    [Authorize(Policy = Permissions.InventoryView)]
    [ProducesResponseType(typeof(ApiResponse<List<InventoryItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLowStockItems(CancellationToken cancellationToken)
    {
        var result = await _inventoryService.GetLowStockAsync(cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
