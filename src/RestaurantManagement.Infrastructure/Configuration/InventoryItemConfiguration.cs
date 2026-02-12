using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.ToTable("inventory_items");

        builder.HasKey(ii => ii.Id);

        builder.Property(ii => ii.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(ii => ii.SKU)
            .HasMaxLength(50);

        builder.Property(ii => ii.Unit)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(ii => ii.CurrentStock)
            .HasPrecision(12, 3)
            .HasDefaultValue(0m);

        builder.Property(ii => ii.MinStock)
            .HasPrecision(12, 3)
            .HasDefaultValue(0m);

        builder.Property(ii => ii.MaxStock)
            .HasPrecision(12, 3);

        builder.Property(ii => ii.CostPerUnit)
            .HasPrecision(10, 2)
            .HasDefaultValue(0m);

        builder.Property(ii => ii.StorageLocation)
            .HasMaxLength(200);

        builder.HasIndex(ii => ii.RestaurantId);
        builder.HasIndex(ii => ii.CategoryId);
        builder.HasIndex(ii => ii.SupplierId);
        builder.HasIndex(ii => ii.TenantId);
        builder.HasIndex(ii => ii.SKU);
        builder.HasIndex(ii => new { ii.RestaurantId, ii.Name });

        builder.HasOne(ii => ii.Category)
            .WithMany(ic => ic.InventoryItems)
            .HasForeignKey(ii => ii.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ii => ii.Supplier)
            .WithMany(s => s.InventoryItems)
            .HasForeignKey(ii => ii.SupplierId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(ii => ii.StockMovements)
            .WithOne(sm => sm.InventoryItem)
            .HasForeignKey(sm => sm.InventoryItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(ii => ii.DishIngredients)
            .WithOne(di => di.InventoryItem)
            .HasForeignKey(di => di.InventoryItemId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
