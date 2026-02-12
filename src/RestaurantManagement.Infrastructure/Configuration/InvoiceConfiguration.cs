using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.ToTable("invoices");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.InvoiceNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(i => i.CustomerName)
            .HasMaxLength(200);

        builder.Property(i => i.CustomerPhone)
            .HasMaxLength(20);

        builder.Property(i => i.CustomerGstNumber)
            .HasMaxLength(20);

        builder.Property(i => i.SubTotal)
            .HasPrecision(12, 2);

        builder.Property(i => i.DiscountAmount)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(i => i.CgstAmount)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(i => i.SgstAmount)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(i => i.GstAmount)
            .HasPrecision(12, 2)
            .HasDefaultValue(0m);

        builder.Property(i => i.TotalAmount)
            .HasPrecision(12, 2);

        builder.Property(i => i.PaymentMethod)
            .HasConversion<string?>()
            .HasMaxLength(20);

        builder.Property(i => i.PaymentStatus)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(PaymentStatus.Pending);

        builder.Property(i => i.PdfUrl)
            .HasMaxLength(500);

        builder.HasIndex(i => i.RestaurantId);
        builder.HasIndex(i => i.OrderId)
            .IsUnique();
        builder.HasIndex(i => i.TenantId);
        builder.HasIndex(i => i.InvoiceNumber);
        builder.HasIndex(i => new { i.RestaurantId, i.InvoiceNumber })
            .IsUnique();

        builder.HasMany(i => i.LineItems)
            .WithOne(li => li.Invoice)
            .HasForeignKey(li => li.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
