using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RestaurantManagement.Domain.Entities;

namespace RestaurantManagement.Infrastructure.Configuration;

public class RestaurantConfiguration : IEntityTypeConfiguration<Restaurant>
{
    public void Configure(EntityTypeBuilder<Restaurant> builder)
    {
        builder.ToTable("restaurants");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.LogoUrl)
            .HasMaxLength(500);

        builder.Property(r => r.Description)
            .HasMaxLength(2000);

        builder.Property(r => r.Phone)
            .HasMaxLength(20);

        builder.Property(r => r.Email)
            .HasMaxLength(256);

        builder.Property(r => r.Website)
            .HasMaxLength(500);

        builder.Property(r => r.GstNumber)
            .HasMaxLength(20);

        builder.Property(r => r.PanNumber)
            .HasMaxLength(20);

        builder.Property(r => r.FssaiNumber)
            .HasMaxLength(20);

        builder.HasIndex(r => r.TenantId);
        builder.HasIndex(r => r.Name);

        builder.HasMany(r => r.Branches)
            .WithOne(b => b.Restaurant)
            .HasForeignKey(b => b.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Categories)
            .WithOne(c => c.Restaurant)
            .HasForeignKey(c => c.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.MenuItems)
            .WithOne(mi => mi.Restaurant)
            .HasForeignKey(mi => mi.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Combos)
            .WithOne(c => c.Restaurant)
            .HasForeignKey(c => c.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Orders)
            .WithOne(o => o.Restaurant)
            .HasForeignKey(o => o.RestaurantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Tables)
            .WithOne(t => t.Restaurant)
            .HasForeignKey(t => t.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Staff)
            .WithOne(s => s.Restaurant)
            .HasForeignKey(s => s.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Discounts)
            .WithOne(d => d.Restaurant)
            .HasForeignKey(d => d.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Coupons)
            .WithOne(c => c.Restaurant)
            .HasForeignKey(c => c.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Feedbacks)
            .WithOne(f => f.Restaurant)
            .HasForeignKey(f => f.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.TaxConfigurations)
            .WithOne(tc => tc.Restaurant)
            .HasForeignKey(tc => tc.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Invoices)
            .WithOne(i => i.Restaurant)
            .HasForeignKey(i => i.RestaurantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Expenses)
            .WithOne(e => e.Restaurant)
            .HasForeignKey(e => e.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.InventoryCategories)
            .WithOne(ic => ic.Restaurant)
            .HasForeignKey(ic => ic.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.InventoryItems)
            .WithOne(ii => ii.Restaurant)
            .HasForeignKey(ii => ii.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.Suppliers)
            .WithOne(s => s.Restaurant)
            .HasForeignKey(s => s.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.KitchenOrderTickets)
            .WithOne(kot => kot.Restaurant)
            .HasForeignKey(kot => kot.RestaurantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(r => r.Shifts)
            .WithOne(s => s.Restaurant)
            .HasForeignKey(s => s.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.LedgerEntries)
            .WithOne(le => le.Restaurant)
            .HasForeignKey(le => le.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.DailySettlements)
            .WithOne(ds => ds.Restaurant)
            .HasForeignKey(ds => ds.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
