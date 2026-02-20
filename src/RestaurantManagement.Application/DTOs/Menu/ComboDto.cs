namespace RestaurantManagement.Application.DTOs.Menu;

public class ComboDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal ComboPrice { get; set; }
    public decimal OriginalTotalPrice { get; set; }
    public decimal ComboDiscount { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ComboItemDto> Items { get; set; } = new();
}

public class ComboItemDto
{
    public Guid Id { get; set; }
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public decimal MenuItemPrice { get; set; }
    public int Quantity { get; set; }
}

public class CreateComboDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal ComboPrice { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<CreateComboItemDto> Items { get; set; } = new();
}

public class UpdateComboDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal ComboPrice { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public List<CreateComboItemDto> Items { get; set; } = new();
}

public class CreateComboItemDto
{
    public Guid MenuItemId { get; set; }
    public int Quantity { get; set; } = 1;
}
