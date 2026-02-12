using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class DailySettlementConfiguration : IEntityTypeConfiguration<DailySettlement>
{
    public void Configure(EntityTypeBuilder<DailySettlement> builder)
    {
        builder.ToTable("daily_settlements");

        builder.HasKey(ds => ds.Id);

        builder.Property(ds => ds.TotalOrders)
            .HasDefaultValue(0);

        builder.Property(ds => ds.TotalRevenue)
            .HasPrecision(14, 2)
            .HasDefaultValue(0m);

        builder.Property(ds => ds.CashCollection)
            .HasPrecision(14, 2)
            .HasDefaultValue(0m);

        builder.Property(ds => ds.CardCollection)
            .HasPrecision(14, 2)
            .HasDefaultValue(0m);

        builder.Property(ds => ds.OnlineCollection)
            .HasPrecision(14, 2)
            .HasDefaultValue(0m);

        builder.Property(ds => ds.TotalExpenses)
            .HasPrecision(14, 2)
            .HasDefaultValue(0m);

        builder.Property(ds => ds.NetAmount)
            .HasPrecision(14, 2)
            .HasDefaultValue(0m);

        builder.Property(ds => ds.Notes)
            .HasMaxLength(2000);

        builder.HasIndex(ds => ds.RestaurantId);
        builder.HasIndex(ds => ds.TenantId);
        builder.HasIndex(ds => ds.SettlementDate);
        builder.HasIndex(ds => new { ds.RestaurantId, ds.SettlementDate })
            .IsUnique();
    }
}
