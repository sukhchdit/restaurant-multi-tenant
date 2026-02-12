namespace RestaurantManagement.Application.DTOs.Inventory;

public class RestockDto
{
    public decimal Quantity { get; set; }
    public decimal? CostPerUnit { get; set; }
    public string? Notes { get; set; }
}
