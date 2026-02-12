using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class Refund : TenantEntity
{
    public Guid PaymentId { get; set; }
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public RefundStatus Status { get; set; } = RefundStatus.Pending;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? TransactionId { get; set; }

    // Navigation properties
    public virtual Payment Payment { get; set; } = null!;
    public virtual Order Order { get; set; } = null!;
}
