using RestaurantManagement.API.Extensions;
using RestaurantManagement.API.Filters;
using RestaurantManagement.API.Hubs;
using RestaurantManagement.API.Middleware;
using RestaurantManagement.Application;
using RestaurantManagement.Infrastructure;
using RestaurantManagement.Infrastructure.DbContext;
using RestaurantManagement.Infrastructure.Logging;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ──── Serilog ────
builder.Host.UseSerilogConfiguration();

// ──── Infrastructure (DB, Repositories, Cache, File Storage) ────
builder.Services.AddInfrastructure(builder.Configuration);

// ──── Application Services (AutoMapper, FluentValidation, all service implementations) ────
builder.Services.AddApplication();

// ──── API Services (HTTP context, tenant, user - overrides Application's CurrentUserService) ────
builder.Services.AddApiServices();

// ──── Authentication & Authorization ────
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddAuthorizationPolicies();

// ──── CORS ────
builder.Services.AddCorsPolicy(builder.Configuration);

// ──── Controllers ────
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.KebabCaseLower));
    options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
});

// ──── SignalR ────
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// ──── Swagger ────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerDocumentation();

// ──── Health Checks ────
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("mysql");

var app = builder.Build();

// ──── Middleware Pipeline ────

// Exception handling (first in pipeline)
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Request logging
app.UseMiddleware<RequestLoggingMiddleware>();

// Swagger (all environments for now)
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Restaurant Management API v1");
    options.RoutePrefix = "swagger";
});

// HTTPS redirection
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS
app.UseCors("DefaultCors");

// Static files (uploads)
app.UseStaticFiles();

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Tenant resolution (after auth, so JWT claims are available)
app.UseMiddleware<TenantResolutionMiddleware>();

// Map controllers
app.MapControllers();

// Map SignalR hubs
app.MapHub<OrderHub>("/hubs/orders");
app.MapHub<KitchenHub>("/hubs/kitchen");
app.MapHub<NotificationHub>("/hubs/notifications");

// Health checks
app.MapHealthChecks("/health");

// Serilog request logging
app.UseSerilogRequestLogging();

// ──── Database Migration & Seed ────
if (app.Environment.IsDevelopment())
{
    try
    {
        await app.Services.ApplyMigrationsAndSeedAsync();
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Database migration failed - MySQL may not be running. Starting without database.");
    }
}

Log.Information("Restaurant Management API started successfully");
app.Run();
