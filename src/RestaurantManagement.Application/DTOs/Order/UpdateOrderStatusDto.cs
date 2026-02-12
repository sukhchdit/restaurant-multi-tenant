using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Order;

public class UpdateOrderStatusDto
{
    public OrderStatus Status { get; set; }
}
