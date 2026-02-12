using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Application.DTOs.KOT;

public class KOTDto
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string KOTNumber { get; set; } = string.Empty;
    public string? TableNumber { get; set; }
    public KOTStatus Status { get; set; }
    public string Priority { get; set; } = "low";
    public Guid? AssignedChefId { get; set; }
    public string? AssignedChefName { get; set; }
    public string? Notes { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<KOTItemDto> Items { get; set; } = new();
}
