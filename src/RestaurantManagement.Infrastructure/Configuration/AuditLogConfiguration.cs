using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("audit_logs");

        builder.HasKey(al => al.Id);

        builder.Property(al => al.UserEmail)
            .HasMaxLength(256);

        builder.Property(al => al.Action)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.Property(al => al.EntityType)
            .HasMaxLength(100);

        builder.Property(al => al.EntityId)
            .HasMaxLength(50);

        builder.Property(al => al.OldValues)
            .HasColumnType("longtext");

        builder.Property(al => al.NewValues)
            .HasColumnType("longtext");

        builder.Property(al => al.IpAddress)
            .HasMaxLength(50);

        builder.Property(al => al.UserAgent)
            .HasMaxLength(500);

        builder.Property(al => al.Description)
            .HasMaxLength(1000);

        builder.HasIndex(al => al.TenantId);
        builder.HasIndex(al => al.UserId);
        builder.HasIndex(al => al.Action);
        builder.HasIndex(al => al.EntityType);
        builder.HasIndex(al => al.CreatedAt);
    }
}
