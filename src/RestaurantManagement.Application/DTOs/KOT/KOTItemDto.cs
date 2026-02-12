using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.KOT;

public class KOTItemDto
{
    public Guid Id { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Notes { get; set; }
    public bool IsVeg { get; set; }
    public KOTStatus Status { get; set; }
}
