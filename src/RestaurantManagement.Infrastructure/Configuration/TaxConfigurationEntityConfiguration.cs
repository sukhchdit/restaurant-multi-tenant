using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class TaxConfigurationEntityConfiguration : IEntityTypeConfiguration<TaxConfiguration>
{
    public void Configure(EntityTypeBuilder<TaxConfiguration> builder)
    {
        builder.ToTable("tax_configurations");

        builder.HasKey(tc => tc.Id);

        builder.Property(tc => tc.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(tc => tc.Rate)
            .HasPrecision(5, 2);

        builder.Property(tc => tc.ApplicableOn)
            .HasMaxLength(200);

        builder.Property(tc => tc.IsActive)
            .HasDefaultValue(true);

        builder.HasIndex(tc => tc.RestaurantId);
        builder.HasIndex(tc => tc.TenantId);
    }
}
