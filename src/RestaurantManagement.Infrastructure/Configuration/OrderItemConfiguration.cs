using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");

        builder.HasKey(oi => oi.Id);

        builder.Property(oi => oi.MenuItemName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(oi => oi.Notes)
            .HasMaxLength(1000);

        builder.Property(oi => oi.UnitPrice)
            .HasPrecision(10, 2);

        builder.Property(oi => oi.TotalPrice)
            .HasPrecision(10, 2);

        builder.Property(oi => oi.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(OrderStatus.Pending);

        builder.HasIndex(oi => oi.OrderId);
        builder.HasIndex(oi => oi.MenuItemId);
        builder.HasIndex(oi => oi.TenantId);

        builder.HasMany(oi => oi.OrderItemAddons)
            .WithOne(oia => oia.OrderItem)
            .HasForeignKey(oia => oia.OrderItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(oi => oi.KOTItems)
            .WithOne(ki => ki.OrderItem)
            .HasForeignKey(ki => ki.OrderItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
