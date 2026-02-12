namespace RestaurantManagement.Domain.Entities;

public class InvoiceLineItem : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public decimal TaxRate { get; set; } = 0;
    public decimal TaxAmount { get; set; } = 0;

    // Navigation properties
    public virtual Invoice Invoice { get; set; } = null!;
}
