namespace RestaurantManagement.Application.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? TenantId { get; }
    Guid? RestaurantId { get; }
    string? Email { get; }
    string? Role { get; }
}
