using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> builder)
    {
        builder.ToTable("menu_items");

        builder.HasKey(mi => mi.Id);

        builder.Property(mi => mi.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(mi => mi.Description)
            .HasMaxLength(2000);

        builder.Property(mi => mi.Cuisine)
            .HasMaxLength(100);

        builder.Property(mi => mi.Price)
            .HasPrecision(10, 2);

        builder.Property(mi => mi.DiscountedPrice)
            .HasPrecision(10, 2);

        builder.Property(mi => mi.ImageUrl)
            .HasMaxLength(500);

        builder.Property(mi => mi.Tags)
            .HasMaxLength(500);

        builder.Property(mi => mi.AvailableDays)
            .HasMaxLength(100);

        builder.Property(mi => mi.IsVeg)
            .HasDefaultValue(false);

        builder.Property(mi => mi.IsAvailable)
            .HasDefaultValue(true);

        builder.Property(mi => mi.SortOrder)
            .HasDefaultValue(0);

        builder.HasIndex(mi => mi.RestaurantId);
        builder.HasIndex(mi => mi.CategoryId);
        builder.HasIndex(mi => mi.TenantId);
        builder.HasIndex(mi => mi.IsAvailable);
        builder.HasIndex(mi => new { mi.RestaurantId, mi.Name });

        builder.HasMany(mi => mi.Addons)
            .WithOne(a => a.MenuItem)
            .HasForeignKey(a => a.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(mi => mi.ComboItems)
            .WithOne(ci => ci.MenuItem)
            .HasForeignKey(ci => ci.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(mi => mi.OrderItems)
            .WithOne(oi => oi.MenuItem)
            .HasForeignKey(oi => oi.MenuItemId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(mi => mi.DishIngredients)
            .WithOne(di => di.MenuItem)
            .HasForeignKey(di => di.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
