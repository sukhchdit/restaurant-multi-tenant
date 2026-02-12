using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class Expense : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public Guid CategoryId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateOnly ExpenseDate { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public string? ReceiptUrl { get; set; }
    public Guid? ApprovedBy { get; set; }
    public ExpenseStatus Status { get; set; } = ExpenseStatus.Pending;

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual ExpenseCategory Category { get; set; } = null!;
}
