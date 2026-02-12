namespace RestaurantManagement.Domain.Entities;

public class DishIngredient : TenantEntity
{
    public Guid MenuItemId { get; set; }
    public Guid InventoryItemId { get; set; }
    public decimal QuantityRequired { get; set; }
    public string Unit { get; set; } = string.Empty;
    public bool IsOptional { get; set; } = false;

    // Navigation properties
    public virtual MenuItem MenuItem { get; set; } = null!;
    public virtual InventoryItem InventoryItem { get; set; } = null!;
}
