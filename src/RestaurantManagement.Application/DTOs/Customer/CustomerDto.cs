namespace RestaurantManagement.Application.DTOs.Customer;

public class CustomerDto
{
    public Guid Id { get; set; }
    public Guid? UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public DateOnly? Anniversary { get; set; }
    public int LoyaltyPoints { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalSpent { get; set; }
    public bool IsVIP { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
