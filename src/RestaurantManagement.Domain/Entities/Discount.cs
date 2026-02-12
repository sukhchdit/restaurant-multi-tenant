using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class Discount : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal Value { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public string? ApplicableOn { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? MenuItemId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? AllowedRoles { get; set; }
    public bool AutoApply { get; set; } = false;

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual Category? Category { get; set; }
    public virtual MenuItem? MenuItem { get; set; }
    public virtual ICollection<Coupon> Coupons { get; set; } = new List<Coupon>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
