using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> builder)
    {
        builder.ToTable("feedbacks");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Comment)
            .HasMaxLength(2000);

        builder.Property(f => f.Response)
            .HasMaxLength(2000);

        builder.HasIndex(f => f.CustomerId);
        builder.HasIndex(f => f.OrderId);
        builder.HasIndex(f => f.RestaurantId);
        builder.HasIndex(f => f.TenantId);
        builder.HasIndex(f => f.Rating);

        builder.HasOne(f => f.Order)
            .WithMany()
            .HasForeignKey(f => f.OrderId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
