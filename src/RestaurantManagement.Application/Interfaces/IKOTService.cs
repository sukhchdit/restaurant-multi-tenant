using RestaurantManagement.Application.DTOs.KOT;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IKOTService
{
    Task<ApiResponse<List<KOTDto>>> GetActiveKOTsAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<KOTDto>> AcknowledgeAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<KOTDto>> StartPreparingAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<KOTDto>> MarkReadyAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<KOTDto>> MarkPrintedAsync(Guid id, CancellationToken cancellationToken = default);
}
