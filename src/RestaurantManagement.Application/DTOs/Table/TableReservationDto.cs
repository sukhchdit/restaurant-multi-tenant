using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.Table;

public class TableReservationDto
{
    public Guid Id { get; set; }
    public Guid TableId { get; set; }
    public string TableNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public Guid? CustomerId { get; set; }
    public int PartySize { get; set; }
    public DateOnly ReservationDate { get; set; }
    public TimeOnly ReservationTime { get; set; }
    public int Duration { get; set; }
    public ReservationStatus Status { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
