using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class StockMovement : TenantEntity
{
    public Guid InventoryItemId { get; set; }
    public StockMovementType MovementType { get; set; }
    public decimal Quantity { get; set; }
    public decimal PreviousStock { get; set; }
    public decimal NewStock { get; set; }
    public decimal? CostPerUnit { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual InventoryItem InventoryItem { get; set; } = null!;
}
