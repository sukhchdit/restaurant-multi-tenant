using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class KitchenOrderTicket : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public Guid OrderId { get; set; }
    public string KOTNumber { get; set; } = string.Empty;
    public string? TableNumber { get; set; }
    public KOTStatus Status { get; set; } = KOTStatus.NotSent;
    public int Priority { get; set; } = 0;
    public Guid? AssignedChefId { get; set; }
    public string? Notes { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? PrintedAt { get; set; }
    public int PrintCount { get; set; } = 0;

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual Order Order { get; set; } = null!;
    public virtual Staff? AssignedChef { get; set; }
    public virtual ICollection<KOTItem> KOTItems { get; set; } = new List<KOTItem>();
}
