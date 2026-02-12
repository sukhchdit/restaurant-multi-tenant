using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Interfaces;

public class AuditLogDto
{
    public Guid Id { get; set; }
    public Guid? TenantId { get; set; }
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public AuditAction Action { get; set; }
    public string? EntityType { get; set; }
    public string? EntityId { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public interface IAuditLogService
{
    Task<ApiResponse<PaginatedResultDto<AuditLogDto>>> GetLogsAsync(
        int pageNumber = 1,
        int pageSize = 20,
        AuditAction? action = null,
        string? entityType = null,
        Guid? userId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        CancellationToken cancellationToken = default);
}
