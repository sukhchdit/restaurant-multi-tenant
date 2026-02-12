using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RestaurantManagement.API.Filters;
using RestaurantManagement.API.Services;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Shared.Constants;

namespace RestaurantManagement.API.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSecret = configuration["JWT:Secret"] ?? throw new InvalidOperationException("JWT:Secret is not configured");
        var jwtIssuer = configuration["JWT:Issuer"] ?? "RestaurantManagement";
        var jwtAudience = configuration["JWT:Audience"] ?? "RestaurantManagementApp";

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ClockSkew = TimeSpan.Zero
            };

            // SignalR token handling
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var accessToken = context.Request.Query["access_token"];
                    var path = context.HttpContext.Request.Path;

                    if (!string.IsNullOrEmpty(accessToken) &&
                        (path.StartsWithSegments("/hubs/orders") ||
                         path.StartsWithSegments("/hubs/kitchen") ||
                         path.StartsWithSegments("/hubs/notifications")))
                    {
                        context.Token = accessToken;
                    }

                    return Task.CompletedTask;
                }
            };
        });

        return services;
    }

    public static IServiceCollection AddAuthorizationPolicies(this IServiceCollection services)
    {
        services.AddAuthorization(options =>
        {
            // Menu policies
            options.AddPolicy(Permissions.MenuView, policy => policy.RequireClaim("permission", Permissions.MenuView));
            options.AddPolicy(Permissions.MenuCreate, policy => policy.RequireClaim("permission", Permissions.MenuCreate));
            options.AddPolicy(Permissions.MenuUpdate, policy => policy.RequireClaim("permission", Permissions.MenuUpdate));
            options.AddPolicy(Permissions.MenuDelete, policy => policy.RequireClaim("permission", Permissions.MenuDelete));

            // Order policies
            options.AddPolicy(Permissions.OrderView, policy => policy.RequireClaim("permission", Permissions.OrderView));
            options.AddPolicy(Permissions.OrderCreate, policy => policy.RequireClaim("permission", Permissions.OrderCreate));
            options.AddPolicy(Permissions.OrderUpdate, policy => policy.RequireClaim("permission", Permissions.OrderUpdate));
            options.AddPolicy(Permissions.OrderDelete, policy => policy.RequireClaim("permission", Permissions.OrderDelete));
            options.AddPolicy(Permissions.OrderCancel, policy => policy.RequireClaim("permission", Permissions.OrderCancel));

            // KOT policies
            options.AddPolicy(Permissions.KotView, policy => policy.RequireClaim("permission", Permissions.KotView));
            options.AddPolicy(Permissions.KotUpdate, policy => policy.RequireClaim("permission", Permissions.KotUpdate));

            // Table policies
            options.AddPolicy(Permissions.TableView, policy => policy.RequireClaim("permission", Permissions.TableView));
            options.AddPolicy(Permissions.TableCreate, policy => policy.RequireClaim("permission", Permissions.TableCreate));
            options.AddPolicy(Permissions.TableUpdate, policy => policy.RequireClaim("permission", Permissions.TableUpdate));
            options.AddPolicy(Permissions.TableDelete, policy => policy.RequireClaim("permission", Permissions.TableDelete));

            // Inventory policies
            options.AddPolicy(Permissions.InventoryView, policy => policy.RequireClaim("permission", Permissions.InventoryView));
            options.AddPolicy(Permissions.InventoryCreate, policy => policy.RequireClaim("permission", Permissions.InventoryCreate));
            options.AddPolicy(Permissions.InventoryUpdate, policy => policy.RequireClaim("permission", Permissions.InventoryUpdate));
            options.AddPolicy(Permissions.InventoryDelete, policy => policy.RequireClaim("permission", Permissions.InventoryDelete));

            // Staff policies
            options.AddPolicy(Permissions.StaffView, policy => policy.RequireClaim("permission", Permissions.StaffView));
            options.AddPolicy(Permissions.StaffCreate, policy => policy.RequireClaim("permission", Permissions.StaffCreate));
            options.AddPolicy(Permissions.StaffUpdate, policy => policy.RequireClaim("permission", Permissions.StaffUpdate));
            options.AddPolicy(Permissions.StaffDelete, policy => policy.RequireClaim("permission", Permissions.StaffDelete));

            // Customer policies
            options.AddPolicy(Permissions.CustomerView, policy => policy.RequireClaim("permission", Permissions.CustomerView));
            options.AddPolicy(Permissions.CustomerCreate, policy => policy.RequireClaim("permission", Permissions.CustomerCreate));
            options.AddPolicy(Permissions.CustomerUpdate, policy => policy.RequireClaim("permission", Permissions.CustomerUpdate));

            // Payment policies
            options.AddPolicy(Permissions.PaymentView, policy => policy.RequireClaim("permission", Permissions.PaymentView));
            options.AddPolicy(Permissions.PaymentProcess, policy => policy.RequireClaim("permission", Permissions.PaymentProcess));
            options.AddPolicy(Permissions.PaymentRefund, policy => policy.RequireClaim("permission", Permissions.PaymentRefund));

            // Discount policies
            options.AddPolicy(Permissions.DiscountView, policy => policy.RequireClaim("permission", Permissions.DiscountView));
            options.AddPolicy(Permissions.DiscountCreate, policy => policy.RequireClaim("permission", Permissions.DiscountCreate));
            options.AddPolicy(Permissions.DiscountUpdate, policy => policy.RequireClaim("permission", Permissions.DiscountUpdate));
            options.AddPolicy(Permissions.DiscountDelete, policy => policy.RequireClaim("permission", Permissions.DiscountDelete));

            // Billing policies
            options.AddPolicy(Permissions.BillingView, policy => policy.RequireClaim("permission", Permissions.BillingView));
            options.AddPolicy(Permissions.BillingCreate, policy => policy.RequireClaim("permission", Permissions.BillingCreate));
            options.AddPolicy(Permissions.BillingExport, policy => policy.RequireClaim("permission", Permissions.BillingExport));

            // Report policies
            options.AddPolicy(Permissions.ReportView, policy => policy.RequireClaim("permission", Permissions.ReportView));
            options.AddPolicy(Permissions.ReportExport, policy => policy.RequireClaim("permission", Permissions.ReportExport));

            // Settings policies
            options.AddPolicy(Permissions.SettingsView, policy => policy.RequireClaim("permission", Permissions.SettingsView));
            options.AddPolicy(Permissions.SettingsUpdate, policy => policy.RequireClaim("permission", Permissions.SettingsUpdate));

            // Audit & Notification policies
            options.AddPolicy(Permissions.AuditView, policy => policy.RequireClaim("permission", Permissions.AuditView));
            options.AddPolicy(Permissions.NotificationView, policy => policy.RequireClaim("permission", Permissions.NotificationView));
        });

        return services;
    }

    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Restaurant Management API",
                Version = "v1",
                Description = "Multi-tenant restaurant management platform API",
                Contact = new OpenApiContact
                {
                    Name = "Restaurant Management Team",
                    Email = "support@restaurantmgmt.com"
                }
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.ApiKey,
                Scheme = "Bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter 'Bearer' followed by a space and the JWT token.\nExample: Bearer eyJhbGciOiJI..."
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000" };

        services.AddCors(options =>
        {
            options.AddPolicy("DefaultCors", policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyHeader()
                      .AllowAnyMethod()
                      .AllowCredentials();
            });
        });

        return services;
    }

    public static IServiceCollection AddApiServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ITenantService, HttpTenantService>();
        services.AddScoped<ValidationFilter>();

        return services;
    }
}
