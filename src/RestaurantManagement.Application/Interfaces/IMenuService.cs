using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Menu;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IMenuService
{
    Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync(CancellationToken cancellationToken = default);
    Task<ApiResponse<CategoryDto>> CreateCategoryAsync(CategoryDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<CategoryDto>> UpdateCategoryAsync(Guid id, CategoryDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteCategoryAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<PaginatedResultDto<MenuItemDto>>> GetItemsAsync(int pageNumber = 1, int pageSize = 20, string? search = null, Guid? categoryId = null, bool? isVeg = null, bool? isAvailable = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<MenuItemDto>> GetItemByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<MenuItemDto>> CreateItemAsync(CreateMenuItemDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<MenuItemDto>> UpdateItemAsync(Guid id, UpdateMenuItemDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteItemAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<MenuItemDto>> ToggleAvailabilityAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<CategoryDto>>> GetPublicMenuAsync(Guid restaurantId, CancellationToken cancellationToken = default);
}
