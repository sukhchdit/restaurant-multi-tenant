using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Order;

public class UpdateOrderDto
{
    public Guid? TableId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public OrderType? OrderType { get; set; }
    public Guid? WaiterId { get; set; }
    public string? SpecialNotes { get; set; }
    public string? DeliveryAddress { get; set; }
    public List<CreateOrderItemDto>? Items { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public decimal? ExtraCharges { get; set; }
    public bool? IsGstApplied { get; set; }
    public decimal? GstPercentage { get; set; }
    public decimal? VatPercentage { get; set; }
    public decimal? PaidAmount { get; set; }
}
