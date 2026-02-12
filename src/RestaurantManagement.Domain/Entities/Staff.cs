using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class Staff : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public string? AvatarUrl { get; set; }
    public StaffShift Shift { get; set; } = StaffShift.Morning;
    public StaffStatus Status { get; set; } = StaffStatus.Active;
    public DateOnly? JoinDate { get; set; }
    public decimal? Salary { get; set; }
    public string? EmergencyContact { get; set; }
    public string? Address { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual User? User { get; set; }
    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public virtual ICollection<Order> WaiterOrders { get; set; } = new List<Order>();
    public virtual ICollection<Order> DeliveryOrders { get; set; } = new List<Order>();
    public virtual ICollection<KitchenOrderTicket> AssignedKOTs { get; set; } = new List<KitchenOrderTicket>();
}
