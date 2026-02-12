using RestaurantManagement.Application.DTOs.Billing;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public interface IBillingService
{
    Task<ApiResponse<InvoiceDto>> GenerateInvoiceAsync(Guid orderId, CancellationToken cancellationToken = default);
    Task<ApiResponse<PaginatedResultDto<InvoiceDto>>> GetInvoicesAsync(int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<ApiResponse<byte[]>> GetInvoicePdfAsync(Guid invoiceId, CancellationToken cancellationToken = default);
    Task<ApiResponse> EmailInvoiceAsync(Guid invoiceId, string email, CancellationToken cancellationToken = default);
}
