using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public class SettingsDto
{
    public Guid Id { get; set; }
    public string Currency { get; set; } = "INR";
    public decimal TaxRate { get; set; }
    public string TimeZone { get; set; } = "Asia/Kolkata";
    public string DateFormat { get; set; } = "dd/MM/yyyy";
    public string? ReceiptHeader { get; set; }
    public string? ReceiptFooter { get; set; }
}

public class UpdateSettingsDto
{
    public string? Currency { get; set; }
    public decimal? TaxRate { get; set; }
    public string? TimeZone { get; set; }
    public string? DateFormat { get; set; }
    public string? ReceiptHeader { get; set; }
    public string? ReceiptFooter { get; set; }
}

public interface ISettingsService
{
    Task<ApiResponse<SettingsDto>> GetSettingsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<SettingsDto>> UpdateSettingsAsync(UpdateSettingsDto dto, CancellationToken cancellationToken = default);
}
