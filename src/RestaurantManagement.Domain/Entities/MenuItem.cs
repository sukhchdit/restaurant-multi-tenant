namespace RestaurantManagement.Domain.Entities;

public class MenuItem : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public Guid CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Cuisine { get; set; }
    public decimal Price { get; set; }
    public decimal? DiscountedPrice { get; set; }
    public bool IsVeg { get; set; } = false;
    public bool IsHalf { get; set; } = false;
    public bool IsAvailable { get; set; } = true;
    public int? PreparationTime { get; set; }
    public string? ImageUrl { get; set; }
    public int? CalorieCount { get; set; }
    public int? SpiceLevel { get; set; }
    public string? Tags { get; set; }
    public int SortOrder { get; set; } = 0;
    public TimeOnly? AvailableFrom { get; set; }
    public TimeOnly? AvailableTo { get; set; }
    public string? AvailableDays { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual Category Category { get; set; } = null!;
    public virtual ICollection<MenuItemAddon> Addons { get; set; } = new List<MenuItemAddon>();
    public virtual ICollection<ComboItem> ComboItems { get; set; } = new List<ComboItem>();
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public virtual ICollection<DishIngredient> DishIngredients { get; set; } = new List<DishIngredient>();
}
