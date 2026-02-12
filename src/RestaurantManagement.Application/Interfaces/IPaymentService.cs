using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Payment;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IPaymentService
{
    Task<ApiResponse<PaymentDto>> ProcessPaymentAsync(ProcessPaymentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<PaymentDto>> SplitPaymentAsync(SplitPaymentDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<RefundResponseDto>> RefundAsync(RefundDto dto, CancellationToken cancellationToken = default);
    Task<ApiResponse<PaginatedResultDto<PaymentDto>>> GetPaymentsAsync(int pageNumber = 1, int pageSize = 20, Guid? orderId = null, CancellationToken cancellationToken = default);
}
