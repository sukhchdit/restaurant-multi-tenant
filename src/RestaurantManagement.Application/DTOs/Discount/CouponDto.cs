namespace RestaurantManagement.Application.DTOs.Discount;

public class CouponDto
{
    public Guid Id { get; set; }
    public Guid RestaurantId { get; set; }
    public string Code { get; set; } = string.Empty;
    public Guid DiscountId { get; set; }
    public string? DiscountName { get; set; }
    public int MaxUsageCount { get; set; }
    public int UsedCount { get; set; }
    public int? MaxPerCustomer { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
