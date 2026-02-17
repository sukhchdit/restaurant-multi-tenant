namespace RestaurantManagement.Application.DTOs.Account;

public class DailySettlementDto
{
    public Guid Id { get; set; }
    public DateOnly Date { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal CashInHand { get; set; }
    public decimal CardPayments { get; set; }
    public decimal OnlinePayments { get; set; }
    public decimal NetAmount { get; set; }
    public int TotalOrders { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? SettledBy { get; set; }
}
