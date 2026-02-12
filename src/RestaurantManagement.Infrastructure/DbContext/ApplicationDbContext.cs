using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;

namespace RestaurantManagement.Infrastructure.DbContext;

public class ApplicationDbContext : Microsoft.EntityFrameworkCore.DbContext
{
    private readonly Guid? _currentTenantId;
    private readonly Guid? _currentUserId;
    private readonly string? _currentUserEmail;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService)
        : base(options)
    {
        _currentTenantId = currentUserService.TenantId;
        _currentUserId = currentUserService.UserId;
        _currentUserEmail = currentUserService.Email;
    }

    // Identity & Auth
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<TenantSettings> TenantSettings => Set<TenantSettings>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // Restaurant & Menu
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<MenuItemAddon> MenuItemAddons => Set<MenuItemAddon>();
    public DbSet<MenuItemCombo> MenuItemCombos => Set<MenuItemCombo>();
    public DbSet<ComboItem> ComboItems => Set<ComboItem>();

    // Inventory
    public DbSet<InventoryCategory> InventoryCategories => Set<InventoryCategory>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<DishIngredient> DishIngredients => Set<DishIngredient>();

    // Tables & Reservations
    public DbSet<RestaurantTable> RestaurantTables => Set<RestaurantTable>();
    public DbSet<TableReservation> TableReservations => Set<TableReservation>();

    // Orders & Kitchen
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderItemAddon> OrderItemAddons => Set<OrderItemAddon>();
    public DbSet<KitchenOrderTicket> KitchenOrderTickets => Set<KitchenOrderTicket>();
    public DbSet<KOTItem> KOTItems => Set<KOTItem>();

    // Payments & Billing
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PaymentSplit> PaymentSplits => Set<PaymentSplit>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLineItem> InvoiceLineItems => Set<InvoiceLineItem>();

    // Discounts & Coupons
    public DbSet<Discount> Discounts => Set<Discount>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<CouponUsage> CouponUsages => Set<CouponUsage>();

    // Customers
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
    public DbSet<LoyaltyPoint> LoyaltyPoints => Set<LoyaltyPoint>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();

    // Staff & HR
    public DbSet<Staff> Staff => Set<Staff>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<Attendance> Attendances => Set<Attendance>();

    // Finance
    public DbSet<TaxConfiguration> TaxConfigurations => Set<TaxConfiguration>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<DailySettlement> DailySettlements => Set<DailySettlement>();

    // Notifications & Audit
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all entity configurations from this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // Apply global query filters for multi-tenancy and soft delete
        // Also register DateOnly value converters for Oracle MySQL provider compatibility
        var dateOnlyConverter = new ValueConverter<DateOnly, DateTime>(
            d => d.ToDateTime(TimeOnly.MinValue),
            dt => DateOnly.FromDateTime(dt));

        var nullableDateOnlyConverter = new ValueConverter<DateOnly?, DateTime?>(
            d => d.HasValue ? d.Value.ToDateTime(TimeOnly.MinValue) : null,
            dt => dt.HasValue ? DateOnly.FromDateTime(dt.Value) : null);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            var clrType = entityType.ClrType;
            var isTenantEntity = typeof(ITenantEntity).IsAssignableFrom(clrType);
            var isBaseEntity = typeof(BaseEntity).IsAssignableFrom(clrType);

            if (isTenantEntity && isBaseEntity)
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(nameof(ApplyCombinedQueryFilter),
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!
                    .MakeGenericMethod(clrType);

                method.Invoke(this, new object[] { modelBuilder });
            }
            else if (isBaseEntity)
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(nameof(ApplySoftDeleteQueryFilter),
                        System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!
                    .MakeGenericMethod(clrType);

                method.Invoke(this, new object[] { modelBuilder });
            }

            // Apply DateOnly converters for MySQL compatibility
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateOnly))
                {
                    property.SetValueConverter(dateOnlyConverter);
                }
                else if (property.ClrType == typeof(DateOnly?))
                {
                    property.SetValueConverter(nullableDateOnlyConverter);
                }
            }
        }
    }

    private void ApplySoftDeleteQueryFilter<T>(ModelBuilder modelBuilder) where T : BaseEntity
    {
        modelBuilder.Entity<T>().HasQueryFilter(e => !e.IsDeleted);
    }

    private void ApplyCombinedQueryFilter<T>(ModelBuilder modelBuilder) where T : BaseEntity, ITenantEntity
    {
        modelBuilder.Entity<T>().HasQueryFilter(e =>
            (_currentTenantId == null || e.TenantId == _currentTenantId) && !e.IsDeleted);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var auditEntries = OnBeforeSaveChanges();
        SetAuditableProperties();
        HandleSoftDelete();

        var result = await base.SaveChangesAsync(cancellationToken);

        if (auditEntries.Count > 0)
        {
            await OnAfterSaveChangesAsync(auditEntries, cancellationToken);
        }

        return result;
    }

    private void SetAuditableProperties()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is BaseEntity baseEntity)
            {
                if (entry.State == EntityState.Added)
                {
                    baseEntity.CreatedAt = DateTime.UtcNow;
                }

                baseEntity.UpdatedAt = DateTime.UtcNow;
            }

            if (entry.Entity is AuditableEntity auditableEntity)
            {
                if (entry.State == EntityState.Added)
                {
                    auditableEntity.CreatedBy = _currentUserId;
                }

                auditableEntity.UpdatedBy = _currentUserId;
            }

            // Auto-set TenantId for new tenant entities
            if (entry.State == EntityState.Added && entry.Entity is ITenantEntity tenantEntity)
            {
                if (tenantEntity.TenantId == Guid.Empty && _currentTenantId.HasValue)
                {
                    tenantEntity.TenantId = _currentTenantId.Value;
                }
            }
        }
    }

    private void HandleSoftDelete()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Deleted);

        foreach (var entry in entries)
        {
            if (entry.Entity is BaseEntity baseEntity)
            {
                // Convert hard delete to soft delete
                entry.State = EntityState.Modified;
                baseEntity.IsDeleted = true;
                baseEntity.DeletedAt = DateTime.UtcNow;
                baseEntity.UpdatedAt = DateTime.UtcNow;

                if (baseEntity is AuditableEntity auditableEntity)
                {
                    auditableEntity.DeletedBy = _currentUserId;
                    auditableEntity.UpdatedBy = _currentUserId;
                }
            }
        }
    }

    private List<AuditEntry> OnBeforeSaveChanges()
    {
        ChangeTracker.DetectChanges();
        var auditEntries = new List<AuditEntry>();

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
            {
                continue;
            }

            var auditEntry = new AuditEntry
            {
                TenantId = _currentTenantId,
                UserId = _currentUserId,
                UserEmail = _currentUserEmail,
                EntityType = entry.Entity.GetType().Name
            };

            switch (entry.State)
            {
                case EntityState.Added:
                    auditEntry.Action = AuditAction.Create;
                    foreach (var property in entry.Properties)
                    {
                        auditEntry.NewValues[property.Metadata.Name] = property.CurrentValue;
                    }
                    break;

                case EntityState.Modified:
                    auditEntry.Action = AuditAction.Update;
                    foreach (var property in entry.Properties)
                    {
                        if (property.IsModified)
                        {
                            auditEntry.OldValues[property.Metadata.Name] = property.OriginalValue;
                            auditEntry.NewValues[property.Metadata.Name] = property.CurrentValue;
                        }
                    }
                    break;

                case EntityState.Deleted:
                    auditEntry.Action = AuditAction.Delete;
                    foreach (var property in entry.Properties)
                    {
                        auditEntry.OldValues[property.Metadata.Name] = property.OriginalValue;
                    }
                    break;
            }

            // Capture the entity Id
            var idProperty = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "Id");
            if (idProperty != null)
            {
                auditEntry.EntityId = idProperty.CurrentValue?.ToString();
            }

            // Only add if there are actual changes
            if (auditEntry.OldValues.Count > 0 || auditEntry.NewValues.Count > 0)
            {
                auditEntries.Add(auditEntry);
            }
        }

        return auditEntries;
    }

    private async Task OnAfterSaveChangesAsync(List<AuditEntry> auditEntries, CancellationToken cancellationToken)
    {
        var auditLogs = auditEntries.Select(entry => new AuditLog
        {
            TenantId = entry.TenantId,
            UserId = entry.UserId,
            UserEmail = entry.UserEmail,
            Action = entry.Action,
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            OldValues = entry.OldValues.Count > 0
                ? JsonSerializer.Serialize(entry.OldValues, JsonSerializerOptions)
                : null,
            NewValues = entry.NewValues.Count > 0
                ? JsonSerializer.Serialize(entry.NewValues, JsonSerializerOptions)
                : null,
            Description = $"{entry.Action} on {entry.EntityType}"
        });

        AuditLogs.AddRange(auditLogs);
        await base.SaveChangesAsync(cancellationToken);
    }

    private static readonly JsonSerializerOptions JsonSerializerOptions = new()
    {
        WriteIndented = false,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    /// <summary>
    /// Internal helper class to temporarily hold audit information during SaveChanges.
    /// </summary>
    private class AuditEntry
    {
        public Guid? TenantId { get; set; }
        public Guid? UserId { get; set; }
        public string? UserEmail { get; set; }
        public AuditAction Action { get; set; }
        public string? EntityType { get; set; }
        public string? EntityId { get; set; }
        public Dictionary<string, object?> OldValues { get; } = new();
        public Dictionary<string, object?> NewValues { get; } = new();
    }
}
