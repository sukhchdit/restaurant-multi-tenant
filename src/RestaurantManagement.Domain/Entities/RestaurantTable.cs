using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class RestaurantTable : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public Guid BranchId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public TableStatus Status { get; set; } = TableStatus.Available;
    public Guid? CurrentOrderId { get; set; }
    public string? QRCodeUrl { get; set; }
    public int? FloorNumber { get; set; }
    public string? Section { get; set; }
    public double? PositionX { get; set; }
    public double? PositionY { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual Branch Branch { get; set; } = null!;
    public virtual Order? CurrentOrder { get; set; }
    public virtual ICollection<TableReservation> Reservations { get; set; } = new List<TableReservation>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
