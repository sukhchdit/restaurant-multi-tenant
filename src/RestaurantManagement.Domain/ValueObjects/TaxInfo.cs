using System.Text.RegularExpressions;

namespace RestaurantManagement.Domain.ValueObjects;

public partial record TaxInfo
{
    public string? GstNumber { get; init; }
    public string? PanNumber { get; init; }
    public string? FssaiNumber { get; init; }

    public TaxInfo(string? gstNumber, string? panNumber, string? fssaiNumber)
    {
        if (!string.IsNullOrWhiteSpace(gstNumber) && !GstRegex().IsMatch(gstNumber))
            throw new ArgumentException("Invalid GST number format. Expected 15-character alphanumeric.", nameof(gstNumber));

        if (!string.IsNullOrWhiteSpace(panNumber) && !PanRegex().IsMatch(panNumber))
            throw new ArgumentException("Invalid PAN number format. Expected format: ABCDE1234F.", nameof(panNumber));

        if (!string.IsNullOrWhiteSpace(fssaiNumber) && !FssaiRegex().IsMatch(fssaiNumber))
            throw new ArgumentException("Invalid FSSAI number format. Expected 14-digit number.", nameof(fssaiNumber));

        GstNumber = gstNumber?.ToUpperInvariant();
        PanNumber = panNumber?.ToUpperInvariant();
        FssaiNumber = fssaiNumber;
    }

    public bool HasGst => !string.IsNullOrWhiteSpace(GstNumber);
    public bool HasPan => !string.IsNullOrWhiteSpace(PanNumber);
    public bool HasFssai => !string.IsNullOrWhiteSpace(FssaiNumber);

    public override string ToString()
    {
        var parts = new List<string>();
        if (HasGst) parts.Add($"GST: {GstNumber}");
        if (HasPan) parts.Add($"PAN: {PanNumber}");
        if (HasFssai) parts.Add($"FSSAI: {FssaiNumber}");
        return string.Join(", ", parts);
    }

    [GeneratedRegex(@"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", RegexOptions.IgnoreCase)]
    private static partial Regex GstRegex();

    [GeneratedRegex(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", RegexOptions.IgnoreCase)]
    private static partial Regex PanRegex();

    [GeneratedRegex(@"^\d{14}$")]
    private static partial Regex FssaiRegex();
}
