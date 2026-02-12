using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Staff;

public class StaffDto
{
    public Guid Id { get; set; }
    public Guid RestaurantId { get; set; }
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public string? AvatarUrl { get; set; }
    public StaffShift Shift { get; set; }
    public StaffStatus Status { get; set; }
    public DateOnly? JoinDate { get; set; }
    public decimal? Salary { get; set; }
    public string? EmergencyContact { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
}
