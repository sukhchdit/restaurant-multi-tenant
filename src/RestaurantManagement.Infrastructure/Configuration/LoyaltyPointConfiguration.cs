using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class LoyaltyPointConfiguration : IEntityTypeConfiguration<LoyaltyPoint>
{
    public void Configure(EntityTypeBuilder<LoyaltyPoint> builder)
    {
        builder.ToTable("loyalty_points");

        builder.HasKey(lp => lp.Id);

        builder.Property(lp => lp.TransactionType)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(lp => lp.Description)
            .HasMaxLength(500);

        builder.HasIndex(lp => lp.CustomerId);
        builder.HasIndex(lp => lp.OrderId);
        builder.HasIndex(lp => lp.TenantId);

        builder.HasOne(lp => lp.Order)
            .WithMany()
            .HasForeignKey(lp => lp.OrderId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
