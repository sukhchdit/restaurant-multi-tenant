using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Domain.Entities;

public class Order : TenantEntity
{
    public Guid RestaurantId { get; set; }
    public Guid? BranchId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid? TableId { get; set; }
    public Guid? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public Guid? WaiterId { get; set; }
    public OrderType OrderType { get; set; } = OrderType.DineIn;
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public Guid? DiscountId { get; set; }
    public decimal TaxAmount { get; set; } = 0;
    public decimal DeliveryCharge { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal ExtraCharges { get; set; }
    public bool IsGstApplied { get; set; }
    public decimal GstPercentage { get; set; }
    public decimal GstAmount { get; set; }
    public decimal VatPercentage { get; set; }
    public decimal VatAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
    public PaymentMethod? PaymentMethod { get; set; }
    public string? SpecialNotes { get; set; }
    public string? DeliveryAddress { get; set; }
    public Guid? DeliveryPersonId { get; set; }
    public DateTime? EstimatedDeliveryTime { get; set; }
    public DateTime? CancelledAt { get; set; }
    public Guid? CancelledBy { get; set; }
    public string? CancellationReason { get; set; }
    public string? DeletionReason { get; set; }

    // Navigation properties
    public virtual Restaurant Restaurant { get; set; } = null!;
    public virtual Branch? Branch { get; set; }
    public virtual RestaurantTable? Table { get; set; }
    public virtual Customer? Customer { get; set; }
    public virtual Staff? Waiter { get; set; }
    public virtual Staff? DeliveryPerson { get; set; }
    public virtual Discount? Discount { get; set; }
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public virtual ICollection<KitchenOrderTicket> KitchenOrderTickets { get; set; } = new List<KitchenOrderTicket>();
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public virtual Invoice? Invoice { get; set; }
    public virtual ICollection<CouponUsage> CouponUsages { get; set; } = new List<CouponUsage>();
}
