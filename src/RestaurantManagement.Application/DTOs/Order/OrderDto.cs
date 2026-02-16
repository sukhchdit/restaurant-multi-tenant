using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Order;

public class OrderDto
{
    public Guid Id { get; set; }
    public Guid RestaurantId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid? TableId { get; set; }
    public string? TableNumber { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public Guid? WaiterId { get; set; }
    public string? WaiterName { get; set; }
    public OrderType OrderType { get; set; }
    public OrderStatus Status { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal DeliveryCharge { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal ExtraCharges { get; set; }
    public bool IsGstApplied { get; set; }
    public decimal GstPercentage { get; set; }
    public decimal GstAmount { get; set; }
    public decimal VatPercentage { get; set; }
    public decimal VatAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public string? SpecialNotes { get; set; }
    public string? DeliveryAddress { get; set; }
    public DateTime? EstimatedDeliveryTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}
