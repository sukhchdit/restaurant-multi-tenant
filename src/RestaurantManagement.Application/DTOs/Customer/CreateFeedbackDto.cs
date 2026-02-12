namespace RestaurantManagement.Application.DTOs.Customer;

public class CreateFeedbackDto
{
    public Guid? OrderId { get; set; }
    public int Rating { get; set; }
    public int? FoodRating { get; set; }
    public int? ServiceRating { get; set; }
    public int? AmbienceRating { get; set; }
    public string? Comment { get; set; }
}
