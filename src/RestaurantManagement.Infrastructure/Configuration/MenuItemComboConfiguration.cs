using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class MenuItemComboConfiguration : IEntityTypeConfiguration<MenuItemCombo>
{
    public void Configure(EntityTypeBuilder<MenuItemCombo> builder)
    {
        builder.ToTable("menu_item_combos");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Description)
            .HasMaxLength(1000);

        builder.Property(c => c.ComboPrice)
            .HasPrecision(10, 2);

        builder.Property(c => c.ImageUrl)
            .HasMaxLength(500);

        builder.Property(c => c.IsAvailable)
            .HasDefaultValue(true);

        builder.HasIndex(c => c.RestaurantId);
        builder.HasIndex(c => c.TenantId);

        builder.HasMany(c => c.ComboItems)
            .WithOne(ci => ci.Combo)
            .HasForeignKey(ci => ci.ComboId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
