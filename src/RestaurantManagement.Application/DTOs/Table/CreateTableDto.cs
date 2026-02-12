namespace RestaurantManagement.Application.DTOs.Table;

public class CreateTableDto
{
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public int? FloorNumber { get; set; }
    public string? Section { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
}
