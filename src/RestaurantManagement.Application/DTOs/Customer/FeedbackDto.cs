namespace RestaurantManagement.Application.DTOs.Customer;

public class FeedbackDto
{
    public Guid Id { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public Guid? OrderId { get; set; }
    public string? OrderNumber { get; set; }
    public Guid RestaurantId { get; set; }
    public int Rating { get; set; }
    public int? FoodRating { get; set; }
    public int? ServiceRating { get; set; }
    public int? AmbienceRating { get; set; }
    public string? Comment { get; set; }
    public string? Response { get; set; }
    public DateTime? RespondedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
