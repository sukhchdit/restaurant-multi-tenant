using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class Payment : TenantEntity
{
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? TransactionId { get; set; }
    public string? GatewayResponse { get; set; }
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Order Order { get; set; } = null!;
    public virtual ICollection<PaymentSplit> PaymentSplits { get; set; } = new List<PaymentSplit>();
    public virtual ICollection<Refund> Refunds { get; set; } = new List<Refund>();
}
