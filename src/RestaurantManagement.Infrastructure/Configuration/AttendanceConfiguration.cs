using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class AttendanceConfiguration : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> builder)
    {
        builder.ToTable("attendances");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.Status)
            .HasMaxLength(20);

        builder.Property(a => a.Notes)
            .HasMaxLength(500);

        builder.HasIndex(a => a.StaffId);
        builder.HasIndex(a => a.TenantId);
        builder.HasIndex(a => a.Date);
        builder.HasIndex(a => new { a.StaffId, a.Date })
            .IsUnique();
    }
}
