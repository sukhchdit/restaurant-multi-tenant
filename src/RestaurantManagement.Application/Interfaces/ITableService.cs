using RestaurantManagement.Application.DTOs.Table;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface ITableService
{
    Task<ApiResponse<List<TableDto>>> GetTablesAsync(bool availableOnly = false, CancellationToken cancellationToken = default);
    Task<ApiResponse<TableDto>> CreateTableAsync(CreateTableDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<TableDto>> UpdateTableAsync(Guid id, CreateTableDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<TableDto>> UpdateStatusAsync(Guid id, UpdateTableStatusDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<TableDto>> AssignAsync(Guid id, Guid orderId, CancellationToken cancellationToken = default);
    Task<ApiResponse<TableDto>> FreeAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<string>> GetQRCodeAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<TableReservationDto>>> GetReservationsAsync(DateOnly? date = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<TableReservationDto>> CreateReservationAsync(CreateReservationDto dto, CancellationToken cancellationToken = default);
}
