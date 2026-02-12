namespace RestaurantManagement.Application.DTOs.Table;

public class CreateReservationDto
{
    public Guid TableId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public Guid? CustomerId { get; set; }
    public int PartySize { get; set; }
    public DateOnly ReservationDate { get; set; }
    public TimeOnly ReservationTime { get; set; }
    public int Duration { get; set; } = 60;
    public string? Notes { get; set; }
}
