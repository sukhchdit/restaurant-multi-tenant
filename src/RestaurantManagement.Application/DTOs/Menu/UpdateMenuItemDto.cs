namespace RestaurantManagement.Application.DTOs.Menu;

public class UpdateMenuItemDto
{
    public Guid? CategoryId { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Cuisine { get; set; }
    public decimal? Price { get; set; }
    public decimal? DiscountedPrice { get; set; }
    public bool? IsVeg { get; set; }
    public int? PreparationTime { get; set; }
    public string? ImageUrl { get; set; }
    public int? CalorieCount { get; set; }
    public int? SpiceLevel { get; set; }
    public string? Tags { get; set; }
    public int? SortOrder { get; set; }
    public TimeOnly? AvailableFrom { get; set; }
    public TimeOnly? AvailableTo { get; set; }
    public string? AvailableDays { get; set; }
}
