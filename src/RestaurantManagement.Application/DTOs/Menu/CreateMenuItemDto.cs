namespace RestaurantManagement.Application.DTOs.Menu;

public class CreateMenuItemDto
{
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Cuisine { get; set; }
    public decimal Price { get; set; }
    public bool IsVeg { get; set; }
    public int? PreparationTime { get; set; }
    public List<string>? Tags { get; set; }
}
