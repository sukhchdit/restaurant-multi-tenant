using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class ComboItemConfiguration : IEntityTypeConfiguration<ComboItem>
{
    public void Configure(EntityTypeBuilder<ComboItem> builder)
    {
        builder.ToTable("combo_items");

        builder.HasKey(ci => ci.Id);

        builder.Property(ci => ci.Quantity)
            .HasDefaultValue(1);

        builder.HasIndex(ci => ci.ComboId);
        builder.HasIndex(ci => ci.MenuItemId);
        builder.HasIndex(ci => new { ci.ComboId, ci.MenuItemId })
            .IsUnique();
    }
}
