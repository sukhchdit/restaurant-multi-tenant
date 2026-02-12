using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Order;

public class CreateOrderDto
{
    public Guid? TableId { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public OrderType OrderType { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = new();
    public string? SpecialNotes { get; set; }
    public Guid? DiscountId { get; set; }
    public string? DeliveryAddress { get; set; }
}
