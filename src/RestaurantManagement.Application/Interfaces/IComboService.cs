using RestaurantManagement.Application.DTOs.Menu;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IComboService
{
    Task<ApiResponse<List<ComboDto>>> GetCombosAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<ComboDto>> GetComboByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<ComboDto>> CreateAsync(CreateComboDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<ComboDto>> UpdateAsync(Guid id, UpdateComboDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<ComboDto>> ToggleAvailabilityAsync(Guid id, CancellationToken cancellationToken = default);
}
