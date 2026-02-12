using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class TenantSettingsConfiguration : IEntityTypeConfiguration<TenantSettings>
{
    public void Configure(EntityTypeBuilder<TenantSettings> builder)
    {
        builder.ToTable("tenant_settings");

        builder.HasKey(ts => ts.Id);

        builder.Property(ts => ts.Currency)
            .IsRequired()
            .HasMaxLength(10)
            .HasDefaultValue("INR");

        builder.Property(ts => ts.TaxRate)
            .HasPrecision(5, 2);

        builder.Property(ts => ts.TimeZone)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("Asia/Kolkata");

        builder.Property(ts => ts.DateFormat)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("dd/MM/yyyy");

        builder.Property(ts => ts.ReceiptHeader)
            .HasMaxLength(1000);

        builder.Property(ts => ts.ReceiptFooter)
            .HasMaxLength(1000);

        builder.HasIndex(ts => ts.TenantId);
    }
}
