namespace RestaurantManagement.Shared.Constants;

public static class CacheKeys
{
    public static string MenuItems(Guid restaurantId) => $"menu:{restaurantId}";
    public static string Tables(Guid restaurantId) => $"tables:{restaurantId}";
    public static string RestaurantSettings(Guid tenantId) => $"settings:{tenantId}";
    public static string ActiveOrders(Guid restaurantId) => $"orders:active:{restaurantId}";
    public static string UserPermissions(Guid userId) => $"user:permissions:{userId}";
}
