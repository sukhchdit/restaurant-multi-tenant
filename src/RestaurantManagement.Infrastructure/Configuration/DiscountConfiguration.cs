using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class DiscountConfiguration : IEntityTypeConfiguration<Discount>
{
    public void Configure(EntityTypeBuilder<Discount> builder)
    {
        builder.ToTable("discounts");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(d => d.DiscountType)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(d => d.Value)
            .HasPrecision(10, 2);

        builder.Property(d => d.MinOrderAmount)
            .HasPrecision(12, 2);

        builder.Property(d => d.MaxDiscountAmount)
            .HasPrecision(12, 2);

        builder.Property(d => d.ApplicableOn)
            .HasMaxLength(100);

        builder.Property(d => d.AllowedRoles)
            .HasMaxLength(500);

        builder.Property(d => d.IsActive)
            .HasDefaultValue(true);

        builder.Property(d => d.AutoApply)
            .HasDefaultValue(false);

        builder.HasIndex(d => d.RestaurantId);
        builder.HasIndex(d => d.TenantId);
        builder.HasIndex(d => d.IsActive);
        builder.HasIndex(d => new { d.StartDate, d.EndDate });

        builder.HasOne(d => d.Category)
            .WithMany()
            .HasForeignKey(d => d.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(d => d.MenuItem)
            .WithMany()
            .HasForeignKey(d => d.MenuItemId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(d => d.Coupons)
            .WithOne(c => c.Discount)
            .HasForeignKey(c => c.DiscountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
