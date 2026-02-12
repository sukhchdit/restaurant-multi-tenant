using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Payment;

public class SplitPaymentDto
{
    public Guid OrderId { get; set; }
    public List<SplitItemDto> Splits { get; set; } = new();
}

public class SplitItemDto
{
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? TransactionId { get; set; }
    public string? PaidBy { get; set; }
}
