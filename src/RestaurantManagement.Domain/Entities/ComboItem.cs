namespace RestaurantManagement.Domain.Entities;

public class ComboItem : BaseEntity
{
    public Guid ComboId { get; set; }
    public Guid MenuItemId { get; set; }
    public int Quantity { get; set; } = 1;

    // Navigation properties
    public virtual MenuItemCombo Combo { get; set; } = null!;
    public virtual MenuItem MenuItem { get; set; } = null!;
}
