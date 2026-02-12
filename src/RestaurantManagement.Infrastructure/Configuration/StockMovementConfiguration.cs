using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("stock_movements");

        builder.HasKey(sm => sm.Id);

        builder.Property(sm => sm.MovementType)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(sm => sm.Quantity)
            .HasPrecision(12, 3);

        builder.Property(sm => sm.PreviousStock)
            .HasPrecision(12, 3);

        builder.Property(sm => sm.NewStock)
            .HasPrecision(12, 3);

        builder.Property(sm => sm.CostPerUnit)
            .HasPrecision(10, 2);

        builder.Property(sm => sm.ReferenceType)
            .HasMaxLength(100);

        builder.Property(sm => sm.Notes)
            .HasMaxLength(1000);

        builder.HasIndex(sm => sm.InventoryItemId);
        builder.HasIndex(sm => sm.TenantId);
        builder.HasIndex(sm => sm.MovementType);
        builder.HasIndex(sm => sm.CreatedAt);
    }
}
