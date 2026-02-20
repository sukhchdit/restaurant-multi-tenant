namespace RestaurantManagement.Domain.Entities;

public class MenuItemCombo : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal ComboPrice { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual ICollection<ComboItem> ComboItems { get; set; } = new List<ComboItem>();
}
