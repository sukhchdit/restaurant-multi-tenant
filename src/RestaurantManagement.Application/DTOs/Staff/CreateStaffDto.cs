using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Staff;

public class CreateStaffDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public StaffShift Shift { get; set; } = StaffShift.Morning;
    public DateOnly? JoinDate { get; set; }
    public decimal? Salary { get; set; }
}
