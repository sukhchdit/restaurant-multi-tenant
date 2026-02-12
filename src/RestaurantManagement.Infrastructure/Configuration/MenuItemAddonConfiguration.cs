using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class MenuItemAddonConfiguration : IEntityTypeConfiguration<MenuItemAddon>
{
    public void Configure(EntityTypeBuilder<MenuItemAddon> builder)
    {
        builder.ToTable("menu_item_addons");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(a => a.Price)
            .HasPrecision(10, 2);

        builder.Property(a => a.IsAvailable)
            .HasDefaultValue(true);

        builder.HasIndex(a => a.MenuItemId);
        builder.HasIndex(a => a.TenantId);

        builder.HasMany(a => a.OrderItemAddons)
            .WithOne(oia => oia.Addon)
            .HasForeignKey(oia => oia.AddonId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
