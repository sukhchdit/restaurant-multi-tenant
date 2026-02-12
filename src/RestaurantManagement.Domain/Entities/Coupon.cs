namespace RestaurantManagement.Domain.Entities;

public class Coupon : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid DiscountId { get; set; }
    public int MaxUsageCount { get; set; }
    public int UsedCount { get; set; } = 0;
    public int? MaxPerCustomer { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual Discount Discount { get; set; } = null!;
    public virtual ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();
}
