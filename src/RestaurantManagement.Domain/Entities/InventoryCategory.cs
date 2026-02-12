namespace RestaurantManagement.Domain.Entities;

public class InventoryCategory : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public string Name { get; set; } = string.Empty;

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();
}
