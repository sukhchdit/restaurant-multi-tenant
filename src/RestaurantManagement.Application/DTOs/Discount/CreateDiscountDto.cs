using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Discount;

public class CreateDiscountDto
{
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
    public bool AutoApply { get; set; }
}

public class UpdateDiscountDto
{
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
    public bool AutoApply { get; set; }
}
