using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Shared.Constants;
using RestaurantManagement.Shared.Helpers;

namespace RestaurantManagement.Infrastructure.Seed;

public static class DefaultTenantSeedData
{
    // Deterministic IDs for the default seed data
    private static readonly Guid DefaultTenantId = GenerateDeterministicGuid("default_tenant");
    private static readonly Guid DefaultAdminUserId = GenerateDeterministicGuid("default_admin_user");
    private static readonly Guid DefaultTenantSettingsId = GenerateDeterministicGuid("default_tenant_settings");
    private static readonly Guid DefaultUserRoleId = GenerateDeterministicGuid("default_admin_user_role");
    private static readonly Guid DefaultRestaurantId = GenerateDeterministicGuid("default_restaurant");
    private static readonly Guid DefaultBranchId = GenerateDeterministicGuid("default_branch");

    /// <summary>
    /// Returns the default tenant to be seeded on first run.
    /// </summary>
    public static Tenant GetDefaultTenant()
    {
        return new Tenant
        {
            Id = DefaultTenantId,
            Name = "Default Restaurant Group",
            Subdomain = "default",
            IsActive = true,
            SubscriptionPlan = "Enterprise",
            SubscriptionExpiry = new DateTime(2030, 12, 31, 0, 0, 0, DateTimeKind.Utc),
            MaxBranches = 50,
            MaxUsers = 500,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
    }

    /// <summary>
    /// Returns the default tenant settings.
    /// </summary>
    public static TenantSettings GetDefaultTenantSettings()
    {
        return new TenantSettings
        {
            Id = DefaultTenantSettingsId,
            TenantId = DefaultTenantId,
            Currency = "INR",
            TaxRate = 18.00m,
            TimeZone = "Asia/Kolkata",
            DateFormat = "dd/MM/yyyy",
            ReceiptHeader = "Default Restaurant Group",
            ReceiptFooter = "Thank you for dining with us!",
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
    }

    /// <summary>
    /// Returns the default admin user with pre-hashed password.
    /// Email: admin@restaurant.com
    /// Password: Admin@123
    /// </summary>
    public static User GetDefaultAdminUser()
    {
        return new User
        {
            Id = DefaultAdminUserId,
            TenantId = DefaultTenantId,
            Email = "admin@restaurant.com",
            PasswordHash = PasswordHelper.HashPassword("Admin@123"),
            FullName = "System Administrator",
            Phone = "+91-9999999999",
            IsActive = true,
            EmailVerified = true,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
    }

    /// <summary>
    /// Returns the default restaurant.
    /// </summary>
    public static Restaurant GetDefaultRestaurant()
    {
        return new Restaurant
        {
            Id = DefaultRestaurantId,
            TenantId = DefaultTenantId,
            Name = "Spice Paradise",
            Description = "Multi-cuisine restaurant",
            Phone = "+91-9999999999",
            Email = "info@spiceparadise.com",
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
    }

    /// <summary>
    /// Returns the default branch for the default restaurant.
    /// </summary>
    public static Branch GetDefaultBranch()
    {
        return new Branch
        {
            Id = DefaultBranchId,
            TenantId = DefaultTenantId,
            RestaurantId = DefaultRestaurantId,
            Name = "Main Branch",
            AddressLine1 = "123 Main Street",
            City = "Mumbai",
            State = "Maharashtra",
            PostalCode = "400001",
            Country = "India",
            Phone = "+91-9999999999",
            IsActive = true,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
    }

    /// <summary>
    /// Returns the user-role mapping for the default admin (SuperAdmin role).
    /// </summary>
    public static UserRole GetDefaultAdminUserRole()
    {
        return new UserRole
        {
            Id = DefaultUserRoleId,
            TenantId = DefaultTenantId,
            UserId = DefaultAdminUserId,
            RoleId = RoleSeedData.GetRoleId(Roles.SuperAdmin),
            RestaurantId = DefaultRestaurantId,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
    }

    private static Guid GenerateDeterministicGuid(string seed)
    {
        using var md5 = System.Security.Cryptography.MD5.Create();
        var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(seed));
        return new Guid(hash);
    }
}
