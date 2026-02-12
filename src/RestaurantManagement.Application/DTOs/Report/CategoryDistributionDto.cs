namespace RestaurantManagement.Application.DTOs.Report;

public class CategoryDistributionDto
{
    public string Name { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string? Color { get; set; }
}
