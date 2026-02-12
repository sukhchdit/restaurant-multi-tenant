namespace RestaurantManagement.Application.DTOs.Staff;

public class AttendanceDto
{
    public Guid Id { get; set; }
    public Guid StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public DateTime? CheckIn { get; set; }
    public DateTime? CheckOut { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}
