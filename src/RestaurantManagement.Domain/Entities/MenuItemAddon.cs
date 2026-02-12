namespace RestaurantManagement.Domain.Entities;

public class MenuItemAddon : TenantEntity
{
    public Guid MenuItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;

    // Navigation properties
    public virtual MenuItem MenuItem { get; set; } = null!;
    public virtual ICollection<OrderItemAddon> OrderItemAddons { get; set; } = new List<OrderItemAddon>();
}
