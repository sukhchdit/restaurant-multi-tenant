using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class LedgerEntryConfiguration : IEntityTypeConfiguration<LedgerEntry>
{
    public void Configure(EntityTypeBuilder<LedgerEntry> builder)
    {
        builder.ToTable("ledger_entries");

        builder.HasKey(le => le.Id);

        builder.Property(le => le.LedgerType)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(le => le.Category)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(le => le.Description)
            .HasMaxLength(1000);

        builder.Property(le => le.Amount)
            .HasPrecision(12, 2);

        builder.Property(le => le.ReferenceType)
            .HasMaxLength(100);

        builder.HasIndex(le => le.RestaurantId);
        builder.HasIndex(le => le.TenantId);
        builder.HasIndex(le => le.EntryDate);
        builder.HasIndex(le => le.LedgerType);
    }
}
