using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class InvoiceLineItemConfiguration : IEntityTypeConfiguration<InvoiceLineItem>
{
    public void Configure(EntityTypeBuilder<InvoiceLineItem> builder)
    {
        builder.ToTable("invoice_line_items");

        builder.HasKey(li => li.Id);

        builder.Property(li => li.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(li => li.UnitPrice)
            .HasPrecision(10, 2);

        builder.Property(li => li.TotalPrice)
            .HasPrecision(10, 2);

        builder.Property(li => li.TaxRate)
            .HasPrecision(5, 2)
            .HasDefaultValue(0m);

        builder.Property(li => li.TaxAmount)
            .HasPrecision(10, 2)
            .HasDefaultValue(0m);

        builder.HasIndex(li => li.InvoiceId);
    }
}
