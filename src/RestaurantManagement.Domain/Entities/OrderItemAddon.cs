namespace RestaurantManagement.Domain.Entities;

public class OrderItemAddon : BaseEntity
{
    public Guid OrderItemId { get; set; }
    public Guid AddonId { get; set; }
    public string AddonName { get; set; } = string.Empty;
    public decimal Price { get; set; }

    // Navigation properties
    public virtual OrderItem OrderItem { get; set; } = null!;
    public virtual MenuItemAddon Addon { get; set; } = null!;
}
