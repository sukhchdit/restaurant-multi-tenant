using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RestaurantManagement.Infrastructure.DbContext;

namespace RestaurantManagement.Infrastructure.Seed;

/// <summary>
/// Responsible for executing all seed data operations on the database.
/// This class is called during application startup to ensure seed data exists.
/// </summary>
public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(ApplicationDbContext context, ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Seeds the database with initial data if it doesn't already exist.
    /// Operations are idempotent -- running multiple times will not create duplicates.
    /// </summary>
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting database seeding...");

            await SeedPermissionsAsync(cancellationToken);
            await SeedRolesAsync(cancellationToken);
            await SeedRolePermissionsAsync(cancellationToken);
            await SeedDefaultTenantAsync(cancellationToken);
            await SeedDefaultAdminUserAsync(cancellationToken);

            _logger.LogInformation("Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database");
            throw;
        }
    }

    private async Task SeedPermissionsAsync(CancellationToken cancellationToken)
    {
        var permissions = PermissionSeedData.GetPermissions();

        foreach (var permission in permissions)
        {
            var exists = await _context.Permissions
                .IgnoreQueryFilters()
                .AnyAsync(p => p.Id == permission.Id, cancellationToken);

            if (!exists)
            {
                await _context.Permissions.AddAsync(permission, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded {Count} permissions", permissions.Count);
    }

    private async Task SeedRolesAsync(CancellationToken cancellationToken)
    {
        var roles = RoleSeedData.GetRoles();

        foreach (var role in roles)
        {
            var exists = await _context.Roles
                .IgnoreQueryFilters()
                .AnyAsync(r => r.Id == role.Id, cancellationToken);

            if (!exists)
            {
                await _context.Roles.AddAsync(role, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded {Count} roles", roles.Count);
    }

    private async Task SeedRolePermissionsAsync(CancellationToken cancellationToken)
    {
        var rolePermissions = RoleSeedData.GetRolePermissions();

        foreach (var rp in rolePermissions)
        {
            var exists = await _context.RolePermissions
                .IgnoreQueryFilters()
                .AnyAsync(x => x.Id == rp.Id, cancellationToken);

            if (!exists)
            {
                await _context.RolePermissions.AddAsync(rp, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Seeded {Count} role-permission mappings", rolePermissions.Count);
    }

    private async Task SeedDefaultTenantAsync(CancellationToken cancellationToken)
    {
        var tenant = DefaultTenantSeedData.GetDefaultTenant();

        var exists = await _context.Tenants
            .IgnoreQueryFilters()
            .AnyAsync(t => t.Id == tenant.Id, cancellationToken);

        if (!exists)
        {
            await _context.Tenants.AddAsync(tenant, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            var settings = DefaultTenantSeedData.GetDefaultTenantSettings();
            await _context.TenantSettings.AddAsync(settings, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Seeded default tenant: {TenantName}", tenant.Name);
        }
    }

    private async Task SeedDefaultAdminUserAsync(CancellationToken cancellationToken)
    {
        var adminUser = DefaultTenantSeedData.GetDefaultAdminUser();

        var exists = await _context.Users
            .IgnoreQueryFilters()
            .AnyAsync(u => u.Id == adminUser.Id, cancellationToken);

        if (!exists)
        {
            await _context.Users.AddAsync(adminUser, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            var userRole = DefaultTenantSeedData.GetDefaultAdminUserRole();
            await _context.UserRoles.AddAsync(userRole, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Seeded default admin user: {Email}", adminUser.Email);
        }
    }
}
