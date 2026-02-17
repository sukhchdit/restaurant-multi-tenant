namespace RestaurantManagement.Application.DTOs.Account;

public class LedgerEntryDto
{
    public Guid Id { get; set; }
    public DateOnly Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}
