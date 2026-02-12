using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class CustomerAddressConfiguration : IEntityTypeConfiguration<CustomerAddress>
{
    public void Configure(EntityTypeBuilder<CustomerAddress> builder)
    {
        builder.ToTable("customer_addresses");

        builder.HasKey(ca => ca.Id);

        builder.Property(ca => ca.Label)
            .HasMaxLength(50);

        builder.Property(ca => ca.AddressLine1)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(ca => ca.AddressLine2)
            .HasMaxLength(500);

        builder.Property(ca => ca.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(ca => ca.PostalCode)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(ca => ca.IsDefault)
            .HasDefaultValue(false);

        builder.HasIndex(ca => ca.CustomerId);
    }
}
