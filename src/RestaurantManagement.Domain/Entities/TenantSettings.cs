namespace RestaurantManagement.Domain.Entities;

public class TenantSettings : TenantEntity
{
    public string Currency { get; set; } = "INR";
    public decimal TaxRate { get; set; }
    public string TimeZone { get; set; } = "Asia/Kolkata";
    public string DateFormat { get; set; } = "dd/MM/yyyy";
    public string? ReceiptHeader { get; set; }
    public string? ReceiptFooter { get; set; }
}
