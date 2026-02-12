namespace RestaurantManagement.Shared.Constants;

public static class AppConstants
{
    // Pagination
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    // JWT
    public const int JwtAccessTokenExpiryMinutes = 15;
    public const int JwtRefreshTokenExpiryDays = 7;

    // Security
    public const int MaxLoginAttempts = 5;
    public const int LockoutDurationMinutes = 15;

    // Defaults
    public const string DefaultCurrency = "INR";
    public const decimal DefaultTaxRate = 12.00m;
    public const string DefaultTimeZone = "Asia/Kolkata";
}
