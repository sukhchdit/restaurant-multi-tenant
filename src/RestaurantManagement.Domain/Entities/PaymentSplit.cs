using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class PaymentSplit : BaseEntity
{
    public Guid PaymentId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? TransactionId { get; set; }
    public string? PaidBy { get; set; }

    // Navigation properties
    public virtual Payment Payment { get; set; } = null!;
}
