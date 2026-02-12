using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Report;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class ReportService : IReportService
{
    private readonly IRepository<Order> _orderRepository;
    private readonly IRepository<OrderItem> _orderItemRepository;
    private readonly IRepository<Category> _categoryRepository;
    private readonly ICurrentUserService _currentUser;

    public ReportService(
        IRepository<Order> orderRepository,
        IRepository<OrderItem> orderItemRepository,
        IRepository<Category> categoryRepository,
        ICurrentUserService currentUser)
    {
        _orderRepository = orderRepository;
        _orderItemRepository = orderItemRepository;
        _categoryRepository = categoryRepository;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<SalesReportDto>> GetSalesReportAsync(
        DateTime fromDate, DateTime toDate, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<SalesReportDto>.Fail("Restaurant context not found.", 403);

        var orders = await _orderRepository.QueryNoTracking()
            .Where(o => o.RestaurantId == restaurantId.Value && !o.IsDeleted
                        && o.CreatedAt >= fromDate && o.CreatedAt <= toDate
                        && (o.Status == OrderStatus.Completed || o.PaymentStatus == PaymentStatus.Paid))
            .ToListAsync(cancellationToken);

        var totalRevenue = orders.Sum(o => o.TotalAmount);
        var totalOrders = orders.Count;
        var averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Group by month for period data
        var periodData = orders
            .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
            .Select(g => new RevenueChartDto
            {
                Month = $"{g.Key.Year}-{g.Key.Month:D2}",
                Revenue = g.Sum(o => o.TotalAmount)
            })
            .OrderBy(p => p.Month)
            .ToList();

        var result = new SalesReportDto
        {
            TotalRevenue = totalRevenue,
            TotalOrders = totalOrders,
            AverageOrderValue = Math.Round(averageOrderValue, 2),
            PeriodData = periodData
        };

        return ApiResponse<SalesReportDto>.Ok(result);
    }

    public async Task<ApiResponse<List<RevenueChartDto>>> GetRevenueTrendAsync(
        int months = 6, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<RevenueChartDto>>.Fail("Restaurant context not found.", 403);

        var startDate = DateTime.UtcNow.AddMonths(-months).Date;

        var orders = await _orderRepository.QueryNoTracking()
            .Where(o => o.RestaurantId == restaurantId.Value && !o.IsDeleted
                        && o.CreatedAt >= startDate
                        && (o.Status == OrderStatus.Completed || o.PaymentStatus == PaymentStatus.Paid))
            .ToListAsync(cancellationToken);

        var trend = orders
            .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
            .Select(g => new RevenueChartDto
            {
                Month = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                Revenue = g.Sum(o => o.TotalAmount)
            })
            .OrderBy(r => r.Month)
            .ToList();

        // Fill in missing months with zero revenue
        var result = new List<RevenueChartDto>();
        for (int i = months - 1; i >= 0; i--)
        {
            var date = DateTime.UtcNow.AddMonths(-i);
            var monthLabel = date.ToString("MMM yyyy");
            var existing = trend.FirstOrDefault(t => t.Month == monthLabel);
            result.Add(new RevenueChartDto
            {
                Month = monthLabel,
                Revenue = existing?.Revenue ?? 0
            });
        }

        return ApiResponse<List<RevenueChartDto>>.Ok(result);
    }

    public async Task<ApiResponse<List<CategoryDistributionDto>>> GetCategoryDistributionAsync(
        DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<CategoryDistributionDto>>.Fail("Restaurant context not found.", 403);

        var from = fromDate ?? DateTime.UtcNow.AddMonths(-1);
        var to = toDate ?? DateTime.UtcNow;

        var orderItems = await _orderItemRepository.QueryNoTracking()
            .Include(oi => oi.Order)
            .Include(oi => oi.MenuItem)
                .ThenInclude(mi => mi.Category)
            .Where(oi => oi.Order.RestaurantId == restaurantId.Value
                         && !oi.IsDeleted && !oi.Order.IsDeleted
                         && oi.Order.CreatedAt >= from && oi.Order.CreatedAt <= to
                         && (oi.Order.Status == OrderStatus.Completed || oi.Order.PaymentStatus == PaymentStatus.Paid))
            .ToListAsync(cancellationToken);

        var colors = new[] { "#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#EC4899" };

        var distribution = orderItems
            .GroupBy(oi => oi.MenuItem?.Category?.Name ?? "Unknown")
            .Select((g, index) => new CategoryDistributionDto
            {
                Name = g.Key,
                Value = g.Sum(oi => oi.TotalPrice),
                Color = colors[index % colors.Length]
            })
            .OrderByDescending(c => c.Value)
            .ToList();

        return ApiResponse<List<CategoryDistributionDto>>.Ok(distribution);
    }

    public async Task<ApiResponse<List<TopMenuItemDto>>> GetTopItemsAsync(
        int count = 10, DateTime? fromDate = null, DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<List<TopMenuItemDto>>.Fail("Restaurant context not found.", 403);

        var from = fromDate ?? DateTime.UtcNow.AddMonths(-1);
        var to = toDate ?? DateTime.UtcNow;

        var orderItems = await _orderItemRepository.QueryNoTracking()
            .Include(oi => oi.Order)
            .Include(oi => oi.MenuItem)
                .ThenInclude(mi => mi.Category)
            .Where(oi => oi.Order.RestaurantId == restaurantId.Value
                         && !oi.IsDeleted && !oi.Order.IsDeleted
                         && oi.Order.CreatedAt >= from && oi.Order.CreatedAt <= to
                         && (oi.Order.Status == OrderStatus.Completed || oi.Order.PaymentStatus == PaymentStatus.Paid))
            .ToListAsync(cancellationToken);

        var topItems = orderItems
            .GroupBy(oi => new { oi.MenuItemId, oi.MenuItemName, Category = oi.MenuItem?.Category?.Name, Price = oi.UnitPrice })
            .Select(g => new TopMenuItemDto
            {
                Id = g.Key.MenuItemId,
                Name = g.Key.MenuItemName,
                Category = g.Key.Category,
                Price = g.Key.Price,
                OrderCount = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.TotalPrice)
            })
            .OrderByDescending(t => t.OrderCount)
            .Take(count)
            .ToList();

        return ApiResponse<List<TopMenuItemDto>>.Ok(topItems);
    }
}
