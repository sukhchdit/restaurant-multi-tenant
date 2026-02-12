using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class StaffConfiguration : IEntityTypeConfiguration<Staff>
{
    public void Configure(EntityTypeBuilder<Staff> builder)
    {
        builder.ToTable("staff");

        builder.HasKey(s => s.Id);

        builder.Property(s => s.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(s => s.Email)
            .HasMaxLength(256);

        builder.Property(s => s.Phone)
            .HasMaxLength(20);

        builder.Property(s => s.Role)
            .HasMaxLength(50);

        builder.Property(s => s.AvatarUrl)
            .HasMaxLength(500);

        builder.Property(s => s.Salary)
            .HasPrecision(12, 2);

        builder.Property(s => s.EmergencyContact)
            .HasMaxLength(200);

        builder.Property(s => s.Address)
            .HasMaxLength(1000);

        builder.Property(s => s.Shift)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(StaffShift.Morning);

        builder.Property(s => s.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(StaffStatus.Active);

        builder.HasIndex(s => s.RestaurantId);
        builder.HasIndex(s => s.UserId);
        builder.HasIndex(s => s.TenantId);
        builder.HasIndex(s => s.Status);
        builder.HasIndex(s => s.Email);

        builder.HasMany(s => s.Attendances)
            .WithOne(a => a.Staff)
            .HasForeignKey(a => a.StaffId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
