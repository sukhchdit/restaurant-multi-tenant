namespace RestaurantManagement.Application.Interfaces;

public interface ITenantService
{
    Task<Guid?> GetCurrentTenantIdAsync();
}
