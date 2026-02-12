namespace RestaurantManagement.Application.DTOs.Discount;

public class ApplyDiscountDto
{
    public string CouponCode { get; set; } = string.Empty;
    public decimal OrderTotal { get; set; }
}

public class ApplyDiscountResultDto
{
    public Guid DiscountId { get; set; }
    public string DiscountName { get; set; } = string.Empty;
    public decimal DiscountAmount { get; set; }
    public decimal NewTotal { get; set; }
}
