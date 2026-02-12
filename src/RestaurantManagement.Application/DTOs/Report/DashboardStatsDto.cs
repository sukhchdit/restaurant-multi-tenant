namespace RestaurantManagement.Application.DTOs.Report;

public class DashboardStatsDto
{
    public int TodayOrders { get; set; }
    public decimal TodayRevenue { get; set; }
    public int ActiveTables { get; set; }
    public int TotalTables { get; set; }
    public int LowStockItems { get; set; }
    public int PendingOrders { get; set; }
    public int PreparingOrders { get; set; }
    public int ReadyOrders { get; set; }
}
