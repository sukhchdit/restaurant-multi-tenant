using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Order;

public class UpdateOrderDto
{
    public Guid? TableId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public OrderType? OrderType { get; set; }
    public string? SpecialNotes { get; set; }
    public string? DeliveryAddress { get; set; }
    public List<CreateOrderItemDto>? Items { get; set; }
}
