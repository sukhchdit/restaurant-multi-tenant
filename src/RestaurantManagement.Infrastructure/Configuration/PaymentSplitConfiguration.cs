using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class PaymentSplitConfiguration : IEntityTypeConfiguration<PaymentSplit>
{
    public void Configure(EntityTypeBuilder<PaymentSplit> builder)
    {
        builder.ToTable("payment_splits");

        builder.HasKey(ps => ps.Id);

        builder.Property(ps => ps.Amount)
            .HasPrecision(12, 2);

        builder.Property(ps => ps.PaymentMethod)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(ps => ps.TransactionId)
            .HasMaxLength(200);

        builder.Property(ps => ps.PaidBy)
            .HasMaxLength(200);

        builder.HasIndex(ps => ps.PaymentId);
    }
}
