using RestaurantManagement.Application.Interfaces;

namespace RestaurantManagement.API.Services;

public class HttpTenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpTenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Task<Guid?> GetCurrentTenantIdAsync()
    {
        if (_httpContextAccessor.HttpContext?.Items.TryGetValue("TenantId", out var tenantId) == true)
        {
            return Task.FromResult(tenantId as Guid?);
        }

        var tenantClaim = _httpContextAccessor.HttpContext?.User.FindFirst("tenant_id")?.Value;
        if (!string.IsNullOrEmpty(tenantClaim) && Guid.TryParse(tenantClaim, out var parsedId))
        {
            return Task.FromResult<Guid?>(parsedId);
        }

        return Task.FromResult<Guid?>(null);
    }
}
