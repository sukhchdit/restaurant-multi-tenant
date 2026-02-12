namespace RestaurantManagement.Domain.Entities;

public class TaxConfiguration : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? ApplicableOn { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
}
