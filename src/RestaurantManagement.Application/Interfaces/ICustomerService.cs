using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Customer;
using RestaurantManagement.Application.DTOs.Order;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface ICustomerService
{
    Task<ApiResponse<PaginatedResultDto<CustomerDto>>> GetCustomersAsync(int pageNumber = 1, int pageSize = 20, string? search = null, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerDto>> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerDto>> CreateAsync(CreateCustomerDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<CustomerDto>> UpdateAsync(Guid id, CreateCustomerDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<List<OrderDto>>> GetOrderHistoryAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<int>> GetLoyaltyPointsAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<ApiResponse<FeedbackDto>> SubmitFeedbackAsync(Guid customerId, CreateFeedbackDto dto, CancellationToken cancellationToken = default);
}
