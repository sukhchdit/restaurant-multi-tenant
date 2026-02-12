using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class Invoice : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public Guid OrderId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public string? CustomerGstNumber { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public decimal CgstAmount { get; set; } = 0;
    public decimal SgstAmount { get; set; } = 0;
    public decimal GstAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    public PaymentMethod? PaymentMethod { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public string? PdfUrl { get; set; }
    public DateTime? EmailSentAt { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual Order Order { get; set; } = null!;
    public virtual ICollection<InvoiceLineItem> LineItems { get; set; } = new List<InvoiceLineItem>();
}
