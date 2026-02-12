using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class RefundConfiguration : IEntityTypeConfiguration<Refund>
{
    public void Configure(EntityTypeBuilder<Refund> builder)
    {
        builder.ToTable("refunds");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Amount)
            .HasPrecision(12, 2);

        builder.Property(r => r.Reason)
            .HasMaxLength(1000);

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(RefundStatus.Pending);

        builder.Property(r => r.TransactionId)
            .HasMaxLength(200);

        builder.HasIndex(r => r.PaymentId);
        builder.HasIndex(r => r.OrderId);
        builder.HasIndex(r => r.TenantId);
        builder.HasIndex(r => r.Status);

        builder.HasOne(r => r.Order)
            .WithMany()
            .HasForeignKey(r => r.OrderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
