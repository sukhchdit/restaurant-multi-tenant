namespace RestaurantManagement.Application.DTOs.Report;

public class SalesReportDto
{
    public decimal TotalRevenue { get; set; }
    public int TotalOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
    public List<RevenueChartDto> PeriodData { get; set; } = new();
}
