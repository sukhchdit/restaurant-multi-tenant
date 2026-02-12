using System.Text.RegularExpressions;

namespace RestaurantManagement.Domain.ValueObjects;

public partial record Email
{
    public string Value { get; init; }

    public Email(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("Email address is required.", nameof(value));

        value = value.Trim().ToLowerInvariant();

        if (!EmailRegex().IsMatch(value))
            throw new ArgumentException("Invalid email address format.", nameof(value));

        if (value.Length > 254)
            throw new ArgumentException("Email address is too long.", nameof(value));

        Value = value;
    }

    public string Domain => Value.Split('@')[1];
    public string LocalPart => Value.Split('@')[0];

    public override string ToString() => Value;

    public static implicit operator string(Email email) => email.Value;

    [GeneratedRegex(@"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")]
    private static partial Regex EmailRegex();
}
