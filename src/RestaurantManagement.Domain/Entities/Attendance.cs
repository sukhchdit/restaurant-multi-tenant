namespace RestaurantManagement.Domain.Entities;

public class Attendance : TenantEntity
{
    public Guid StaffId { get; set; }
    public DateOnly Date { get; set; }
    public DateTime? CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }

    // Navigation properties
    public virtual Staff Staff { get; set; } = null!;
}
