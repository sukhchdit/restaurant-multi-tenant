using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.OrderNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(o => o.CustomerName)
            .HasMaxLength(200);

        builder.Property(o => o.CustomerPhone)
            .HasMaxLength(20);

        builder.Property(o => o.SpecialNotes)
            .HasMaxLength(2000);

        builder.Property(o => o.DeliveryAddress)
            .HasMaxLength(1000);

        builder.Property(o => o.CancellationReason)
            .HasMaxLength(1000);

        builder.Property(o => o.DeletionReason)
            .HasMaxLength(1000);

        builder.Property(o => o.SubTotal)
            .HasPrecision(12, 2);

        builder.Property(o => o.DiscountAmount)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.TaxAmount)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.DeliveryCharge)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.TotalAmount)
            .HasPrecision(12, 2);

        builder.Property(o => o.DiscountPercentage)
            .HasPrecision(5, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.ExtraCharges)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.IsGstApplied)
            .HasDefaultValue(false);

        builder.Property(o => o.GstPercentage)
            .HasPrecision(5, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.GstAmount)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.VatPercentage)
            .HasPrecision(5, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.VatAmount)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.PaidAmount)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(o => o.OrderType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(OrderType.DineIn);

        builder.Property(o => o.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(OrderStatus.Pending);

        builder.Property(o => o.PaymentStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(PaymentStatus.Pending);

        builder.Property(o => o.PaymentMethod)
            .HasConversion<string?>()
            .HasMaxLength(20);

        builder.HasIndex(o => o.RestaurantId);
        builder.HasIndex(o => o.BranchId);
        builder.HasIndex(o => o.TenantId);
        builder.HasIndex(o => o.OrderNumber);
        builder.HasIndex(o => o.TableId);
        builder.HasIndex(o => o.CustomerId);
        builder.HasIndex(o => o.Status);
        builder.HasIndex(o => o.PaymentStatus);
        builder.HasIndex(o => o.CreatedAt);
        builder.HasIndex(o => new { o.RestaurantId, o.OrderNumber })
            .IsUnique();

        builder.HasOne(o => o.Table)
            .WithMany(t => t.Orders)
            .HasForeignKey(o => o.TableId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.Customer)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.Waiter)
            .WithMany(s => s.WaiterOrders)
            .HasForeignKey(o => o.WaiterId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.DeliveryPerson)
            .WithMany(s => s.DeliveryOrders)
            .HasForeignKey(o => o.DeliveryPersonId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(o => o.Discount)
            .WithMany(d => d.Orders)
            .HasForeignKey(o => o.DiscountId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(o => o.OrderItems)
            .WithOne(oi => oi.Order)
            .HasForeignKey(oi => oi.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.KitchenOrderTickets)
            .WithOne(kot => kot.Order)
            .HasForeignKey(kot => kot.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.Payments)
            .WithOne(p => p.Order)
            .HasForeignKey(p => p.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(o => o.Invoice)
            .WithOne(i => i.Order)
            .HasForeignKey<Invoice>(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(o => o.CouponUsages)
            .WithOne(cu => cu.Order)
            .HasForeignKey(cu => cu.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
