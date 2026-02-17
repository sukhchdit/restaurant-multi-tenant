using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Payment;

public class RefundDto
{
    public Guid PaymentId { get; set; }
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
}

public class RefundByIdDto
{
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
}

public class RefundResponseDto
{
    public Guid Id { get; set; }
    public Guid PaymentId { get; set; }
    public Guid OrderId { get; set; }
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public RefundStatus Status { get; set; }
    public string? TransactionId { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
