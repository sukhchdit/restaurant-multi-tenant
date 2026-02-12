using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class InventoryCategoryConfiguration : IEntityTypeConfiguration<InventoryCategory>
{
    public void Configure(EntityTypeBuilder<InventoryCategory> builder)
    {
        builder.ToTable("inventory_categories");

        builder.HasKey(ic => ic.Id);

        builder.Property(ic => ic.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(ic => ic.RestaurantId);
        builder.HasIndex(ic => ic.TenantId);
        builder.HasIndex(ic => new { ic.RestaurantId, ic.Name })
            .IsUnique();
    }
}
