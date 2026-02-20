namespace RestaurantManagement.Domain.Entities;

public class Restaurant : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Website { get; set; }
    public string? GstNumber { get; set; }
    public string? PanNumber { get; set; }
    public string? FssaiNumber { get; set; }

    // Navigation properties
    public virtual ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();
    public virtual ICollection<MenuItem> MenuItems { get; set; } = new List<MenuItem>();
    public virtual ICollection<MenuItemCombo> Combos { get; set; } = new List<MenuItemCombo>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<RestaurantTable> Tables { get; set; } = new List<RestaurantTable>();
    public virtual ICollection<Staff> Staff { get; set; } = new List<Staff>();
    public virtual ICollection<Discount> Discounts { get; set; } = new List<Discount>();
    public virtual ICollection<Coupon> Coupons { get; set; } = new List<Coupon>();
    public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
    public virtual ICollection<TaxConfiguration> TaxConfigurations { get; set; } = new List<TaxConfiguration>();
    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public virtual ICollection<Expense> Expenses { get; set; } = new List<Expense>();
    public virtual ICollection<InventoryCategory> InventoryCategories { get; set; } = new List<InventoryCategory>();
    public virtual ICollection<InventoryItem> InventoryItems { get; set; } = new List<InventoryItem>();
    public virtual ICollection<Supplier> Suppliers { get; set; } = new List<Supplier>();
    public virtual ICollection<KitchenOrderTicket> KitchenOrderTickets { get; set; } = new List<KitchenOrderTicket>();
    public virtual ICollection<Shift> Shifts { get; set; } = new List<Shift>();
    public virtual ICollection<LedgerEntry> LedgerEntries { get; set; } = new List<LedgerEntry>();
    public virtual ICollection<DailySettlement> DailySettlements { get; set; } = new List<DailySettlement>();
}
