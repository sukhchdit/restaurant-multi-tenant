using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Shared.Constants;

namespace RestaurantManagement.Infrastructure.Seed;

public static class PermissionSeedData
{
    /// <summary>
    /// Returns all permission entities to be seeded into the database.
    /// Permission IDs are deterministic (derived from the permission name) for idempotent seeding.
    /// </summary>
    public static IReadOnlyList<Permission> GetPermissions()
    {
        var permissions = new List<Permission>
        {
            // Menu permissions
            CreatePermission(Permissions.MenuView, "Menu", "View menu items and categories"),
            CreatePermission(Permissions.MenuCreate, "Menu", "Create new menu items and categories"),
            CreatePermission(Permissions.MenuUpdate, "Menu", "Update existing menu items and categories"),
            CreatePermission(Permissions.MenuDelete, "Menu", "Delete menu items and categories"),

            // Order permissions
            CreatePermission(Permissions.OrderView, "Order", "View orders"),
            CreatePermission(Permissions.OrderCreate, "Order", "Create new orders"),
            CreatePermission(Permissions.OrderUpdate, "Order", "Update existing orders"),
            CreatePermission(Permissions.OrderDelete, "Order", "Delete orders"),
            CreatePermission(Permissions.OrderCancel, "Order", "Cancel orders"),

            // KOT permissions
            CreatePermission(Permissions.KotView, "KOT", "View kitchen order tickets"),
            CreatePermission(Permissions.KotUpdate, "KOT", "Update kitchen order tickets status"),

            // Table permissions
            CreatePermission(Permissions.TableView, "Table", "View restaurant tables"),
            CreatePermission(Permissions.TableCreate, "Table", "Create new tables"),
            CreatePermission(Permissions.TableUpdate, "Table", "Update table information"),
            CreatePermission(Permissions.TableDelete, "Table", "Delete tables"),

            // Inventory permissions
            CreatePermission(Permissions.InventoryView, "Inventory", "View inventory items"),
            CreatePermission(Permissions.InventoryCreate, "Inventory", "Create inventory items"),
            CreatePermission(Permissions.InventoryUpdate, "Inventory", "Update inventory items"),
            CreatePermission(Permissions.InventoryDelete, "Inventory", "Delete inventory items"),

            // Staff permissions
            CreatePermission(Permissions.StaffView, "Staff", "View staff members"),
            CreatePermission(Permissions.StaffCreate, "Staff", "Create staff members"),
            CreatePermission(Permissions.StaffUpdate, "Staff", "Update staff information"),
            CreatePermission(Permissions.StaffDelete, "Staff", "Delete staff members"),

            // Customer permissions
            CreatePermission(Permissions.CustomerView, "Customer", "View customer information"),
            CreatePermission(Permissions.CustomerCreate, "Customer", "Create customer records"),
            CreatePermission(Permissions.CustomerUpdate, "Customer", "Update customer information"),

            // Payment permissions
            CreatePermission(Permissions.PaymentView, "Payment", "View payments"),
            CreatePermission(Permissions.PaymentProcess, "Payment", "Process payments"),
            CreatePermission(Permissions.PaymentRefund, "Payment", "Process refunds"),

            // Discount permissions
            CreatePermission(Permissions.DiscountView, "Discount", "View discounts and coupons"),
            CreatePermission(Permissions.DiscountCreate, "Discount", "Create discounts and coupons"),
            CreatePermission(Permissions.DiscountUpdate, "Discount", "Update discounts and coupons"),
            CreatePermission(Permissions.DiscountDelete, "Discount", "Delete discounts and coupons"),

            // Billing permissions
            CreatePermission(Permissions.BillingView, "Billing", "View invoices and billing"),
            CreatePermission(Permissions.BillingCreate, "Billing", "Create invoices"),
            CreatePermission(Permissions.BillingExport, "Billing", "Export billing data"),

            // Report permissions
            CreatePermission(Permissions.ReportView, "Report", "View reports and analytics"),
            CreatePermission(Permissions.ReportExport, "Report", "Export reports"),

            // Settings permissions
            CreatePermission(Permissions.SettingsView, "Settings", "View system settings"),
            CreatePermission(Permissions.SettingsUpdate, "Settings", "Update system settings"),

            // Audit permissions
            CreatePermission(Permissions.AuditView, "Audit", "View audit logs"),

            // Notification permissions
            CreatePermission(Permissions.NotificationView, "Notification", "View notifications"),
        };

        return permissions;
    }

    /// <summary>
    /// Gets the deterministic GUID for a permission by its name.
    /// </summary>
    public static Guid GetPermissionId(string permissionName)
    {
        return GenerateDeterministicGuid($"permission:{permissionName}");
    }

    private static Permission CreatePermission(string name, string module, string description)
    {
        return new Permission
        {
            Id = GetPermissionId(name),
            Name = name,
            Module = module,
            Description = description,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
    }

    /// <summary>
    /// Generates a deterministic GUID from a string seed so that seed data IDs are consistent across runs.
    /// </summary>
    private static Guid GenerateDeterministicGuid(string seed)
    {
        using var md5 = System.Security.Cryptography.MD5.Create();
        var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(seed));
        return new Guid(hash);
    }
}
