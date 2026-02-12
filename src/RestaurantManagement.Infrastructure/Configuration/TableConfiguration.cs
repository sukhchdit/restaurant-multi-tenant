using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class TableConfiguration : IEntityTypeConfiguration<RestaurantTable>
{
    public void Configure(EntityTypeBuilder<RestaurantTable> builder)
    {
        builder.ToTable("restaurant_tables");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TableNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(t => t.QRCodeUrl)
            .HasMaxLength(500);

        builder.Property(t => t.Section)
            .HasMaxLength(100);

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(TableStatus.Available);

        builder.Property(t => t.IsActive)
            .HasDefaultValue(true);

        builder.HasIndex(t => t.RestaurantId);
        builder.HasIndex(t => t.BranchId);
        builder.HasIndex(t => t.TenantId);
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => new { t.RestaurantId, t.BranchId, t.TableNumber })
            .IsUnique();

        builder.HasOne(t => t.CurrentOrder)
            .WithOne()
            .HasForeignKey<RestaurantTable>(t => t.CurrentOrderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(t => t.Reservations)
            .WithOne(r => r.Table)
            .HasForeignKey(r => r.TableId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
