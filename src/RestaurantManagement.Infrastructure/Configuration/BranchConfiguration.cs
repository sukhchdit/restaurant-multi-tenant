using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("branches");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(b => b.AddressLine1)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(b => b.AddressLine2)
            .HasMaxLength(500);

        builder.Property(b => b.City)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(b => b.State)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(b => b.PostalCode)
            .IsRequired()
            .HasMaxLength(10);

        builder.Property(b => b.Country)
            .IsRequired()
            .HasMaxLength(100)
            .HasDefaultValue("India");

        builder.Property(b => b.Phone)
            .HasMaxLength(20);

        builder.Property(b => b.IsActive)
            .HasDefaultValue(true);

        builder.HasIndex(b => b.RestaurantId);
        builder.HasIndex(b => b.TenantId);
        builder.HasIndex(b => b.City);

        builder.HasMany(b => b.Tables)
            .WithOne(t => t.Branch)
            .HasForeignKey(t => t.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(b => b.Orders)
            .WithOne(o => o.Branch)
            .HasForeignKey(o => o.BranchId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
