using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class OrderItem : TenantEntity
{
    public Guid OrderId { get; set; }
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Notes { get; set; }
    public bool IsVeg { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;

    // Navigation properties
    public virtual Order Order { get; set; } = null!;
    public virtual MenuItem MenuItem { get; set; } = null!;
    public virtual ICollection<OrderItemAddon> OrderItemAddons { get; set; } = new List<OrderItemAddon>();
    public virtual ICollection<KOTItem> KOTItems { get; set; } = new List<KOTItem>();
}
