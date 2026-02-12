using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;

namespace RestaurantManagement.Infrastructure.Configuration;

public class KitchenOrderTicketConfiguration : IEntityTypeConfiguration<KitchenOrderTicket>
{
    public void Configure(EntityTypeBuilder<KitchenOrderTicket> builder)
    {
        builder.ToTable("kitchen_order_tickets");

        builder.HasKey(kot => kot.Id);

        builder.Property(kot => kot.KOTNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(kot => kot.TableNumber)
            .HasMaxLength(20);

        builder.Property(kot => kot.Notes)
            .HasMaxLength(1000);

        builder.Property(kot => kot.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .HasDefaultValue(KOTStatus.NotSent);

        builder.Property(kot => kot.Priority)
            .HasDefaultValue(0);

        builder.Property(kot => kot.PrintCount)
            .HasDefaultValue(0);

        builder.HasIndex(kot => kot.RestaurantId);
        builder.HasIndex(kot => kot.OrderId);
        builder.HasIndex(kot => kot.TenantId);
        builder.HasIndex(kot => kot.Status);
        builder.HasIndex(kot => kot.KOTNumber);

        builder.HasOne(kot => kot.AssignedChef)
            .WithMany(s => s.AssignedKOTs)
            .HasForeignKey(kot => kot.AssignedChefId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(kot => kot.KOTItems)
            .WithOne(ki => ki.KitchenOrderTicket)
            .HasForeignKey(ki => ki.KOTId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
