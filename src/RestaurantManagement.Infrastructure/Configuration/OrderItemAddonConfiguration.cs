using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class OrderItemAddonConfiguration : IEntityTypeConfiguration<OrderItemAddon>
{
    public void Configure(EntityTypeBuilder<OrderItemAddon> builder)
    {
        builder.ToTable("order_item_addons");

        builder.HasKey(oia => oia.Id);

        builder.Property(oia => oia.AddonName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(oia => oia.Price)
            .HasPrecision(10, 2);

        builder.HasIndex(oia => oia.OrderItemId);
        builder.HasIndex(oia => oia.AddonId);
    }
}
