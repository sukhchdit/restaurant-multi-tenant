using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class KOTItemConfiguration : IEntityTypeConfiguration<KOTItem>
{
    public void Configure(EntityTypeBuilder<KOTItem> builder)
    {
        builder.ToTable("kot_items");

        builder.HasKey(ki => ki.Id);

        builder.Property(ki => ki.MenuItemName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(ki => ki.Notes)
            .HasMaxLength(1000);

        builder.Property(ki => ki.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(KOTStatus.NotSent);

        builder.HasIndex(ki => ki.KOTId);
        builder.HasIndex(ki => ki.OrderItemId);
    }
}
