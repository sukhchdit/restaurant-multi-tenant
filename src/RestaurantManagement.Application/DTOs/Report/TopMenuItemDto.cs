namespace RestaurantManagement.Application.DTOs.Report;

public class TopMenuItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Category { get; set; }
    public decimal Price { get; set; }
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
}
