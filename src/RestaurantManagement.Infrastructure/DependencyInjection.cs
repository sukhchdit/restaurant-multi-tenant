using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Infrastructure.DbContext;
using RestaurantManagement.Infrastructure.Interfaces;
using RestaurantManagement.Infrastructure.Repositories;
using RestaurantManagement.Infrastructure.Seed;
using RestaurantManagement.Infrastructure.Services;
using StackExchange.Redis;

namespace RestaurantManagement.Infrastructure;

public static class DependencyInjection
{
    /// <summary>
    /// Registers all Infrastructure layer services including the database context,
    /// repositories, caching, file storage, and other infrastructure services.
    /// </summary>
    /// <param name="services">The service collection to register services with.</param>
    /// <param name="configuration">The application configuration.</param>
    /// <returns>The service collection for method chaining.</returns>
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register ApplicationDbContext with MySQL (Oracle MySQL EF Core Provider)
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
        {
            options.UseMySQL(connectionString);

            // Enable sensitive data logging in development
            var environment = configuration["ASPNETCORE_ENVIRONMENT"] ?? "Production";
            if (environment == "Development")
            {
                options.EnableSensitiveDataLogging();
                options.EnableDetailedErrors();
            }
        });

        // Register Generic Repository (open generic)
        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));

        // Register Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register Redis Cache Service
        RegisterRedisCache(services, configuration);

        // Register File Storage Service (Application.Interfaces.IFileStorageService)
        services.AddScoped<IFileStorageService, FileStorageService>();

        // Register QR Code Generator Service (Infrastructure-only interface)
        services.AddSingleton<IQRCodeGeneratorService, QRCodeGeneratorService>();

        // Register Database Seeder
        services.AddScoped<DatabaseSeeder>();

        return services;
    }

    /// <summary>
    /// Applies any pending EF Core migrations and seeds the database.
    /// Call this during application startup (after building the app, before running).
    /// </summary>
    public static async Task ApplyMigrationsAndSeedAsync(this IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILogger<ApplicationDbContext>>();

        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();

            logger.LogInformation("Applying database migrations...");
            await context.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied successfully");

            logger.LogInformation("Seeding database...");
            var seeder = services.GetRequiredService<DatabaseSeeder>();
            await seeder.SeedAsync();
            logger.LogInformation("Database seeding completed");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while migrating or seeding the database");
            throw;
        }
    }

    private static void RegisterRedisCache(IServiceCollection services, IConfiguration configuration)
    {
        var redisConnectionString = configuration.GetConnectionString("Redis");

        if (!string.IsNullOrWhiteSpace(redisConnectionString))
        {
            try
            {
                var redisOptions = ConfigurationOptions.Parse(redisConnectionString);
                redisOptions.AbortOnConnectFail = false; // Graceful fallback
                redisOptions.ConnectTimeout = 5000;
                redisOptions.SyncTimeout = 3000;

                services.AddSingleton<IConnectionMultiplexer>(sp =>
                {
                    var logger = sp.GetRequiredService<ILogger<RedisCacheService>>();
                    try
                    {
                        return ConnectionMultiplexer.Connect(redisOptions);
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to connect to Redis. Cache will be unavailable");
                        return null!;
                    }
                });
            }
            catch
            {
                // If Redis configuration is invalid, register null
                services.AddSingleton<IConnectionMultiplexer>(sp => null!);
            }
        }
        else
        {
            // No Redis connection string configured
            services.AddSingleton<IConnectionMultiplexer>(sp => null!);
        }

        // Register ICacheService from Application.Interfaces
        services.AddSingleton<ICacheService, RedisCacheService>();
    }
}
