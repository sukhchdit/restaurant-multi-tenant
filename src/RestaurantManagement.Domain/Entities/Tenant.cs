namespace RestaurantManagement.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string? SubscriptionPlan { get; set; }
    public DateTime? SubscriptionExpiry { get; set; }
    public int MaxBranches { get; set; }
    public int MaxUsers { get; set; }

    // Navigation properties
    public virtual ICollection<TenantSettings> Settings { get; set; } = new List<TenantSettings>();
    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();
}
