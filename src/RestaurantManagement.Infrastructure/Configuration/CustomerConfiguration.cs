using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("customers");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Email)
            .HasMaxLength(256);

        builder.Property(c => c.Phone)
            .HasMaxLength(20);

        builder.Property(c => c.Notes)
            .HasMaxLength(1000);

        builder.Property(c => c.LoyaltyPoints)
            .HasDefaultValue(0);

        builder.Property(c => c.TotalOrders)
            .HasDefaultValue(0);

        builder.Property(c => c.TotalSpent)
            .HasPrecision(14, 2)
            .HasDefaultValue(0m);

        builder.Property(c => c.IsVIP)
            .HasDefaultValue(false);

        builder.HasIndex(c => c.UserId);
        builder.HasIndex(c => c.TenantId);
        builder.HasIndex(c => c.Email);
        builder.HasIndex(c => c.Phone);

        builder.HasMany(c => c.Addresses)
            .WithOne(a => a.Customer)
            .HasForeignKey(a => a.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.LoyaltyPointHistory)
            .WithOne(lp => lp.Customer)
            .HasForeignKey(lp => lp.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(c => c.Feedbacks)
            .WithOne(f => f.Customer)
            .HasForeignKey(f => f.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(c => c.CouponUsages)
            .WithOne(cu => cu.Customer)
            .HasForeignKey(cu => cu.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
