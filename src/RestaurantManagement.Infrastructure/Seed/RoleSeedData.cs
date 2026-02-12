using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Shared.Constants;

namespace RestaurantManagement.Infrastructure.Seed;

public static class RoleSeedData
{
    /// <summary>
    /// Returns all role entities to be seeded into the database.
    /// Role IDs are deterministic for idempotent seeding.
    /// </summary>
    public static IReadOnlyList<Role> GetRoles()
    {
        return new List<Role>
        {
            CreateRole(Roles.SuperAdmin, "Super Admin", "Full system access across all tenants", true),
            CreateRole(Roles.RestaurantAdmin, "Restaurant Admin", "Full access within a tenant's restaurants", true),
            CreateRole(Roles.Manager, "Manager", "Restaurant management access", true),
            CreateRole(Roles.Cashier, "Cashier", "Billing, payments, and order management", true),
            CreateRole(Roles.Kitchen, "Kitchen", "Kitchen display and KOT management", true),
            CreateRole(Roles.Waiter, "Waiter", "Table service and order taking", true),
            CreateRole(Roles.Delivery, "Delivery", "Delivery order management", true),
            CreateRole(Roles.Customer, "Customer", "Customer-facing ordering", true),
        };
    }

    /// <summary>
    /// Returns all role-permission mappings to be seeded.
    /// Each role gets the permissions defined in Permissions.GetPermissionsForRole().
    /// </summary>
    public static IReadOnlyList<RolePermission> GetRolePermissions()
    {
        var rolePermissions = new List<RolePermission>();

        foreach (var roleName in Roles.All)
        {
            var roleId = GetRoleId(roleName);
            var permissions = Permissions.GetPermissionsForRole(roleName);

            foreach (var permission in permissions)
            {
                var permissionId = PermissionSeedData.GetPermissionId(permission);

                rolePermissions.Add(new RolePermission
                {
                    Id = GenerateDeterministicGuid($"role_permission:{roleName}:{permission}"),
                    RoleId = roleId,
                    PermissionId = permissionId,
                    CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                });
            }
        }

        return rolePermissions;
    }

    /// <summary>
    /// Gets the deterministic GUID for a role by its name.
    /// </summary>
    public static Guid GetRoleId(string roleName)
    {
        return GenerateDeterministicGuid($"role:{roleName}");
    }

    private static Role CreateRole(string name, string displayName, string description, bool isSystemRole)
    {
        return new Role
        {
            Id = GetRoleId(name),
            Name = name,
            DisplayName = displayName,
            Description = description,
            IsSystemRole = isSystemRole,
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
