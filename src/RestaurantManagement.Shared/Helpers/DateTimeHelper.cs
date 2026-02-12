namespace RestaurantManagement.Shared.Helpers;

public static class DateTimeHelper
{
    public static DateTime ToTenantTime(DateTime utcTime, string timeZone)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(timeZone);
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utcTime, DateTimeKind.Utc), tz);
    }

    public static DateTime ToUtc(DateTime localTime, string timeZone)
    {
        var tz = TimeZoneInfo.FindSystemTimeZoneById(timeZone);
        var unspecified = DateTime.SpecifyKind(localTime, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(unspecified, tz);
    }

    public static DateTime GetStartOfDay(DateTime date)
    {
        return date.Date;
    }

    public static DateTime GetEndOfDay(DateTime date)
    {
        return date.Date.AddDays(1).AddTicks(-1);
    }

    public static string FormatDate(DateTime date, string format)
    {
        return date.ToString(format);
    }
}
