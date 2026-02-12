using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Inventory;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IInventoryService
{
    Task<ApiResponse<PaginatedResultDto<InventoryItemDto>>> GetItemsAsync(int pageNumber = 1, int pageSize = 20, string? search = null, Guid? categoryId = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<InventoryItemDto>> CreateItemAsync(CreateInventoryItemDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<InventoryItemDto>> UpdateItemAsync(Guid id, CreateInventoryItemDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<InventoryItemDto>> RestockAsync(Guid id, RestockDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<StockMovementDto>>> GetMovementsAsync(Guid itemId, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<InventoryItemDto>>> GetLowStockAsync(CancellationToken cancellationToken = default);
}
