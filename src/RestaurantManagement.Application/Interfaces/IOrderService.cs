using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Order;
using RestaurantManagement.Application.DTOs.Report;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IOrderService
{
    Task<ApiResponse<PaginatedResultDto<OrderDto>>> GetOrdersAsync(int pageNumber = 1, int pageSize = 20, OrderStatus? status = null, OrderType? orderType = null, string? search = null, DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderDto>> GetOrderByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderDto>> CreateOrderAsync(CreateOrderDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<OrderDto>> UpdateOrderStatusAsync(Guid id, UpdateOrderStatusDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse> CancelOrderAsync(Guid id, string? reason = null, CancellationToken cancellationToken = default);
    Task<ApiResponse> DeleteOrderAsync(Guid id, string? reason = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<DashboardStatsDto>> GetDashboardStatsAsync(CancellationToken cancellationToken = default);
}
