using RestaurantManagement.Application.DTOs.Account;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IAccountService
{
    Task<ApiResponse<List<LedgerEntryDto>>> GetLedgerAsync(string? type = null, string? dateFrom = null, string? dateTo = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<LedgerEntryDto>> CreateLedgerEntryAsync(CreateLedgerEntryDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<DailySettlementDto>>> GetSettlementsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<DailySettlementDto>> SettleDayAsync(string date, CancellationToken cancellationToken = default);
    Task CreateRevenueEntryAsync(Guid orderId, decimal amount, string paymentMethod, string orderNumber, CancellationToken ct = default);
    Task CreateRefundEntryAsync(Guid orderId, decimal amount, string reason, string orderNumber, CancellationToken ct = default);
}
