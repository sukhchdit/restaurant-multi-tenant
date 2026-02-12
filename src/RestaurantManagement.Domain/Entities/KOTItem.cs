using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class KOTItem : BaseEntity
{
    public Guid KOTId { get; set; }
    public Guid OrderItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Notes { get; set; }
    public bool IsVeg { get; set; }
    public KOTStatus Status { get; set; } = KOTStatus.NotSent;

    // Navigation properties
    public virtual KitchenOrderTicket KitchenOrderTicket { get; set; } = null!;
    public virtual OrderItem OrderItem { get; set; } = null!;
}
