namespace RestaurantManagement.Application.DTOs.Inventory;

public class CreateInventoryItemDto
{
    public string Name { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Guid? SupplierId { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal MinStock { get; set; }
    public decimal? MaxStock { get; set; }
    public decimal CostPerUnit { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? StorageLocation { get; set; }
}
