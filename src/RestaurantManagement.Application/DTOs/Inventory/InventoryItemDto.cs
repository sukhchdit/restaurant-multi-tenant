namespace RestaurantManagement.Application.DTOs.Inventory;

public class InventoryItemDto
{
    public Guid Id { get; set; }
    public Guid RestaurantId { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public Guid? SupplierId { get; set; }
    public string? SupplierName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? SKU { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal CurrentStock { get; set; }
    public decimal MinStock { get; set; }
    public decimal? MaxStock { get; set; }
    public decimal CostPerUnit { get; set; }
    public DateTime? LastRestockedAt { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? StorageLocation { get; set; }
    public bool IsLowStock => CurrentStock <= MinStock;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
