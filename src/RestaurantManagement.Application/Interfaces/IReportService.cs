using RestaurantManagement.Application.DTOs.Report;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IReportService
{
    Task<ApiResponse<SalesReportDto>> GetSalesReportAsync(DateTime fromDate, DateTime toDate, string period = "weekly", CancellationToken cancellationToken = default);
    Task<ApiResponse<List<RevenueChartDto>>> GetRevenueTrendAsync(int months = 6, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<CategoryDistributionDto>>> GetCategoryDistributionAsync(DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<TopMenuItemDto>>> GetTopItemsAsync(int count = 10, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
}
