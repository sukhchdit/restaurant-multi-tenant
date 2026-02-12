using System.Security.Claims;
using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userId = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userId != null ? Guid.Parse(userId) : null;
        }
    }

    public Guid? TenantId
    {
        get
        {
            var tenantId = _httpContextAccessor.HttpContext?.User.FindFirst("tenant_id")?.Value;
            return tenantId != null ? Guid.Parse(tenantId) : null;
        }
    }

    public Guid? RestaurantId
    {
        get
        {
            var restaurantId = _httpContextAccessor.HttpContext?.User.FindFirst("restaurant_id")?.Value;
            return restaurantId != null ? Guid.Parse(restaurantId) : null;
        }
    }

    public string? Email => _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Email)?.Value;

    public string? Role => _httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.Role)?.Value;
}
