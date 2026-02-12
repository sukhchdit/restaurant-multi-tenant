namespace RestaurantManagement.Domain.Entities;

public class DailySettlement : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public DateOnly SettlementDate { get; set; }
    public int TotalOrders { get; set; } = 0;
    public decimal TotalRevenue { get; set; } = 0;
    public decimal CashCollection { get; set; } = 0;
    public decimal CardCollection { get; set; } = 0;
    public decimal OnlineCollection { get; set; } = 0;
    public decimal TotalExpenses { get; set; } = 0;
    public decimal NetAmount { get; set; } = 0;
    public Guid? SettledBy { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
}
