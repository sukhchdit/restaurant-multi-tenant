namespace RestaurantManagement.Domain.Entities;

public class Feedback : TenantEntity
{
    public Guid? CustomerId { get; set; }
    public Guid? OrderId { get; set; }
    public Guid RestaurantId { get; set; }
    public int Rating { get; set; }
    public int? FoodRating { get; set; }
    public int? ServiceRating { get; set; }
    public int? AmbienceRating { get; set; }
    public string? Comment { get; set; }
    public string? Response { get; set; }
    public DateTime? RespondedAt { get; set; }
    public Guid? RespondedBy { get; set; }

    // Navigation properties
    public virtual Customer? Customer { get; set; }
    public virtual Order? Order { get; set; }
    public virtual Restaurant Restaurant { get; set; } = null!;
}
