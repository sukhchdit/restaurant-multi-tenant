namespace RestaurantManagement.Domain.Entities;

public class InventoryItem : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public Guid CategoryId { get; set; }
    public Guid? SupplierId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? SKU { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; } = 0;
    public decimal MinStock { get; set; } = 0;
    public decimal? MaxStock { get; set; }
    public decimal CostPerUnit { get; set; } = 0;
    public DateTime? LastRestockedAt { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? StorageLocation { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual InventoryCategory Category { get; set; } = null!;
    public virtual Supplier? Supplier { get; set; }
    public virtual ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public virtual ICollection<DishIngredient> DishIngredients { get; set; } = new List<DishIngredient>();
}
