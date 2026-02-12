using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class CouponUsageConfiguration : IEntityTypeConfiguration<CouponUsage>
{
    public void Configure(EntityTypeBuilder<CouponUsage> builder)
    {
        builder.ToTable("coupon_usages");

        builder.HasKey(cu => cu.Id);

        builder.Property(cu => cu.DiscountAmount)
            .HasPrecision(12, 2);

        builder.HasIndex(cu => cu.CouponId);
        builder.HasIndex(cu => cu.OrderId);
        builder.HasIndex(cu => cu.CustomerId);
    }
}
