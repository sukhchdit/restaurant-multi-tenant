namespace RestaurantManagement.Application.DTOs.Customer;

public class CreateCustomerDto
{
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public DateOnly? Anniversary { get; set; }
    public string? Notes { get; set; }
}
