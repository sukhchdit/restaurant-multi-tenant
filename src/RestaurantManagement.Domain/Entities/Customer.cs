namespace RestaurantManagement.Domain.Entities;

public class Customer : TenantEntity
{
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public DateOnly? Anniversary { get; set; }
    public int LoyaltyPoints { get; set; } = 0;
    public int TotalOrders { get; set; } = 0;
    public decimal TotalSpent { get; set; } = 0;
    public bool IsVIP { get; set; } = false;
    public string? Notes { get; set; }

    // Navigation properties
    public virtual User? User { get; set; }
    public virtual ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<LoyaltyPoint> LoyaltyPointHistory { get; set; } = new List<LoyaltyPoint>();
    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
    public virtual ICollection<TableReservation> Reservations { get; set; } = new List<TableReservation>();
    public virtual ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();
}
