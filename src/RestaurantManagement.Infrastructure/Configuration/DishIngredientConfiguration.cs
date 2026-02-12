using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class DishIngredientConfiguration : IEntityTypeConfiguration<DishIngredient>
{
    public void Configure(EntityTypeBuilder<DishIngredient> builder)
    {
        builder.ToTable("dish_ingredients");

        builder.HasKey(di => di.Id);

        builder.Property(di => di.QuantityRequired)
            .HasPrecision(10, 3);

        builder.Property(di => di.Unit)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(di => di.MenuItemId);
        builder.HasIndex(di => di.InventoryItemId);
        builder.HasIndex(di => di.TenantId);
        builder.HasIndex(di => new { di.MenuItemId, di.InventoryItemId })
            .IsUnique();
    }
}
