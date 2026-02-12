using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;

namespace RestaurantManagement.Infrastructure.Logging;

public static class SerilogConfiguration
{
    /// <summary>
    /// Configures Serilog with console and file sinks, structured logging, and enrichment.
    /// Usage in Program.cs:
    ///   builder.Host.UseSerilogConfiguration();
    /// </summary>
    public static IHostBuilder UseSerilogConfiguration(this IHostBuilder hostBuilder)
    {
        return hostBuilder.UseSerilog((context, services, loggerConfiguration) =>
        {
            var environment = context.HostingEnvironment.EnvironmentName;
            var logPath = context.Configuration["Logging:FilePath"] ?? "logs/restaurant-management-.log";

            loggerConfiguration
                .MinimumLevel.Information()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.EntityFrameworkCore", LogEventLevel.Warning)
                .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
                .MinimumLevel.Override("System", LogEventLevel.Warning)
                .Enrich.FromLogContext()
                .Enrich.WithMachineName()
                .Enrich.WithEnvironmentName()
                .Enrich.WithProperty("Application", "RestaurantManagement")
                .Enrich.WithProperty("Environment", environment)
                // Console sink with structured output
                .WriteTo.Console(
                    outputTemplate:
                    "[{Timestamp:HH:mm:ss} {Level:u3}] [{CorrelationId}] [{TenantId}] {Message:lj}{NewLine}{Exception}")
                // File sink with daily rolling
                .WriteTo.File(
                    path: logPath,
                    rollingInterval: RollingInterval.Day,
                    retainedFileCountLimit: 30,
                    outputTemplate:
                    "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] [{CorrelationId}] [{TenantId}] [{SourceContext}] {Message:lj}{NewLine}{Exception}",
                    fileSizeLimitBytes: 100_000_000, // 100 MB per file
                    rollOnFileSizeLimit: true,
                    shared: true);

            // In development, lower the minimum level for debugging
            if (environment == "Development")
            {
                loggerConfiguration.MinimumLevel.Debug();
                loggerConfiguration.MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Information);
            }
        });
    }
}
