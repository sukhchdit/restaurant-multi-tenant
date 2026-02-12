namespace RestaurantManagement.Shared.Constants;

public static class Roles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string RestaurantAdmin = "RestaurantAdmin";
    public const string Manager = "Manager";
    public const string Cashier = "Cashier";
    public const string Kitchen = "Kitchen";
    public const string Waiter = "Waiter";
    public const string Delivery = "Delivery";
    public const string Customer = "Customer";

    public static readonly IReadOnlyList<string> All = new[]
    {
        SuperAdmin,
        RestaurantAdmin,
        Manager,
        Cashier,
        Kitchen,
        Waiter,
        Delivery,
        Customer
    };
}
