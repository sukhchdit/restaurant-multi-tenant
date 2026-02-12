namespace RestaurantManagement.Domain.Entities;

public class CouponUsage : BaseEntity
{
    public Guid CouponId { get; set; }
    public Guid OrderId { get; set; }
    public Guid? CustomerId { get; set; }
    public decimal DiscountAmount { get; set; }
    public DateTime UsedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual Coupon Coupon { get; set; } = null!;
    public virtual Order Order { get; set; } = null!;
    public virtual Customer? Customer { get; set; }
}
