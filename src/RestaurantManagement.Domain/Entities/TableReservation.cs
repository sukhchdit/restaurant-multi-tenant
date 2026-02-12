using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class TableReservation : TenantEntity
{
    public Guid TableId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public Guid? CustomerId { get; set; }
    public int PartySize { get; set; }
    public DateOnly ReservationDate { get; set; }
    public TimeOnly ReservationTime { get; set; }
    public int Duration { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    public string? Notes { get; set; }

    // Navigation properties
    public virtual RestaurantTable Table { get; set; } = null!;
    public virtual Customer? Customer { get; set; }
}
