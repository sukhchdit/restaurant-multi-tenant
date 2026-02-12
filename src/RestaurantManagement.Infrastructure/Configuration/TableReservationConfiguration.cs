using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class TableReservationConfiguration : IEntityTypeConfiguration<TableReservation>
{
    public void Configure(EntityTypeBuilder<TableReservation> builder)
    {
        builder.ToTable("table_reservations");

        builder.HasKey(tr => tr.Id);

        builder.Property(tr => tr.CustomerName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(tr => tr.CustomerPhone)
            .HasMaxLength(20);

        builder.Property(tr => tr.Notes)
            .HasMaxLength(1000);

        builder.Property(tr => tr.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(ReservationStatus.Pending);

        builder.HasIndex(tr => tr.TableId);
        builder.HasIndex(tr => tr.CustomerId);
        builder.HasIndex(tr => tr.TenantId);
        builder.HasIndex(tr => tr.ReservationDate);
        builder.HasIndex(tr => tr.Status);

        builder.HasOne(tr => tr.Customer)
            .WithMany(c => c.Reservations)
            .HasForeignKey(tr => tr.CustomerId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
