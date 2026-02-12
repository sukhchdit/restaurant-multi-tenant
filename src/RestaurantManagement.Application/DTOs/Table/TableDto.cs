using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Table;

public class TableDto
{
    public Guid Id { get; set; }
    public Guid RestaurantId { get; set; }
    public Guid BranchId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public TableStatus Status { get; set; }
    public Guid? CurrentOrderId { get; set; }
    public string? QRCodeUrl { get; set; }
    public int? FloorNumber { get; set; }
    public string? Section { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
    public bool IsActive { get; set; }
}
