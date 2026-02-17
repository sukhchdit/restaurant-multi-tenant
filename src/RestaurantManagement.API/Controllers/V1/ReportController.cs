using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RestaurantManagement.Application.DTOs.Report;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.API.Controllers.V1;

[ApiController]
[Route("api/v1/reports")]
[Authorize]
public class ReportController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportController(IReportService reportService)
    {
        _reportService = reportService;
    }

    private static (DateTime from, DateTime to) ResolveDateRange(
        string? startDate, string? endDate, string? startTime, string? endTime)
    {
        var today = DateTime.UtcNow.Date;

        var fromDate = string.IsNullOrEmpty(startDate) ? today : DateTime.Parse(startDate).Date;
        var toDate = string.IsNullOrEmpty(endDate) ? today : DateTime.Parse(endDate).Date;

        var fromTime = string.IsNullOrEmpty(startTime) ? TimeSpan.Zero : TimeSpan.Parse(startTime);
        var toTime = string.IsNullOrEmpty(endTime) ? new TimeSpan(23, 59, 59) : TimeSpan.Parse(endTime);

        return (fromDate.Add(fromTime), toDate.Add(toTime));
    }

    [HttpGet("sales")]
    [Authorize(Policy = Permissions.ReportView)]
    [ProducesResponseType(typeof(ApiResponse<SalesReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesReport(
        [FromQuery] string? period = null,
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? startTime = null,
        [FromQuery] string? endTime = null,
        CancellationToken cancellationToken = default)
    {
        var (from, to) = ResolveDateRange(startDate, endDate, startTime, endTime);

        var effectivePeriod = period ?? ((to - from).TotalDays switch
        {
            <= 1 => "daily",
            <= 7 => "weekly",
            _ => "monthly"
        });

        var result = await _reportService.GetSalesReportAsync(from, to, effectivePeriod, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("revenue-trend")]
    [Authorize(Policy = Permissions.ReportView)]
    [ProducesResponseType(typeof(ApiResponse<List<RevenueChartDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRevenueTrend(
        [FromQuery] int months = 6,
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? startTime = null,
        [FromQuery] string? endTime = null,
        CancellationToken cancellationToken = default)
    {
        var hasDateRange = !string.IsNullOrEmpty(startDate) && !string.IsNullOrEmpty(endDate);
        if (hasDateRange)
        {
            var (from, to) = ResolveDateRange(startDate, endDate, startTime, endTime);
            var result = await _reportService.GetRevenueTrendAsync(months, from, to, cancellationToken);
            return StatusCode(result.StatusCode, result);
        }
        else
        {
            var result = await _reportService.GetRevenueTrendAsync(months, cancellationToken: cancellationToken);
            return StatusCode(result.StatusCode, result);
        }
    }

    [HttpGet("category-distribution")]
    [Authorize(Policy = Permissions.ReportView)]
    [ProducesResponseType(typeof(ApiResponse<List<CategoryDistributionDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategoryDistribution(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? startTime = null,
        [FromQuery] string? endTime = null,
        CancellationToken cancellationToken = default)
    {
        var (from, to) = ResolveDateRange(startDate, endDate, startTime, endTime);
        var result = await _reportService.GetCategoryDistributionAsync(from, to, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }

    [HttpGet("top-items")]
    [Authorize(Policy = Permissions.ReportView)]
    [ProducesResponseType(typeof(ApiResponse<List<TopMenuItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopMenuItems(
        [FromQuery] int count = 10,
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null,
        [FromQuery] string? startTime = null,
        [FromQuery] string? endTime = null,
        CancellationToken cancellationToken = default)
    {
        var (from, to) = ResolveDateRange(startDate, endDate, startTime, endTime);
        var result = await _reportService.GetTopItemsAsync(count, from, to, cancellationToken);
        return StatusCode(result.StatusCode, result);
    }
}
