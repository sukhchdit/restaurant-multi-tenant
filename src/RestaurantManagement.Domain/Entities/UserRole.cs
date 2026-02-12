namespace RestaurantManagement.Domain.Entities;

public class UserRole : TenantEntity
{
    public Guid UserId { get; set; }
    public Guid RoleId { get; set; }
    public Guid? RestaurantId { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Role Role { get; set; } = null!;
    public virtual Restaurant? Restaurant { get; set; }
}
