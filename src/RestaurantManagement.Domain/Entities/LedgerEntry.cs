using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class LedgerEntry : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public DateOnly EntryDate { get; set; }
    public LedgerType LedgerType { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Amount { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? ReferenceType { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
}
