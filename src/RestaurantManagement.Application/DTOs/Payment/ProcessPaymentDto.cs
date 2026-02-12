using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Payment;

public class ProcessPaymentDto
{
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? TransactionId { get; set; }
}
