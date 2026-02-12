using System.Text.RegularExpressions;

namespace RestaurantManagement.Domain.ValueObjects;

public partial record PhoneNumber
{
    public string CountryCode { get; init; }
    public string Number { get; init; }

    public PhoneNumber(string countryCode, string number)
    {
        if (string.IsNullOrWhiteSpace(countryCode))
            throw new ArgumentException("Country code is required.", nameof(countryCode));
        if (string.IsNullOrWhiteSpace(number))
            throw new ArgumentException("Phone number is required.", nameof(number));
        if (!PhoneNumberRegex().IsMatch(number))
            throw new ArgumentException("Phone number contains invalid characters.", nameof(number));

        CountryCode = countryCode.StartsWith('+') ? countryCode : $"+{countryCode}";
        Number = number.Trim();
    }

    public string ToFormattedString() => $"{CountryCode} {Number}";

    public override string ToString() => ToFormattedString();

    [GeneratedRegex(@"^[\d\s\-()]+$")]
    private static partial Regex PhoneNumberRegex();
}
