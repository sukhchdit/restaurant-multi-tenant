namespace RestaurantManagement.Domain.Entities;

public class Shift : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
}
