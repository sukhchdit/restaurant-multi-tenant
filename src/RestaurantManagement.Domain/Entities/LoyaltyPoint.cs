namespace RestaurantManagement.Domain.Entities;

public class LoyaltyPoint : TenantEntity
{
    public Guid CustomerId { get; set; }
    public Guid? OrderId { get; set; }
    public int Points { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public string? Description { get; set; }

    // Navigation properties
    public virtual Customer Customer { get; set; } = null!;
    public virtual Order? Order { get; set; }
}
