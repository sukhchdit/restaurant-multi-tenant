using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class ExpenseConfiguration : IEntityTypeConfiguration<Expense>
{
    public void Configure(EntityTypeBuilder<Expense> builder)
    {
        builder.ToTable("expenses");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(e => e.Amount)
            .HasPrecision(12, 2);

        builder.Property(e => e.PaymentMethod)
            .HasConversion<string?>()
            .HasMaxLength(20);

        builder.Property(e => e.ReceiptUrl)
            .HasMaxLength(500);

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ExpenseStatus.Pending);

        builder.HasIndex(e => e.RestaurantId);
        builder.HasIndex(e => e.CategoryId);
        builder.HasIndex(e => e.TenantId);
        builder.HasIndex(e => e.ExpenseDate);
        builder.HasIndex(e => e.Status);
    }
}
