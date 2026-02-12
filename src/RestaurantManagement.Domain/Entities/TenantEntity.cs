using RestaurantManagement.Domain.Interfaces;

namespace RestaurantManagement.Domain.Entities;

public abstract class TenantEntity : AuditableEntity, ITenantEntity
{
    public Guid TenantId { get; set; }

    // Navigation property
    public virtual Tenant Tenant { get; set; } = null!;
}
