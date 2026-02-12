using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class AuditLogService : IAuditLogService
{
    private readonly IRepository<AuditLog> _auditLogRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public AuditLogService(
        IRepository<AuditLog> auditLogRepository,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _auditLogRepository = auditLogRepository;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PaginatedResultDto<AuditLogDto>>> GetLogsAsync(
        int pageNumber = 1, int pageSize = 20,
        AuditAction? action = null, string? entityType = null,
        Guid? userId = null, DateTime? fromDate = null, DateTime? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var tenantId = _currentUser.TenantId;
        if (tenantId == null)
            return ApiResponse<PaginatedResultDto<AuditLogDto>>.Fail("Tenant context not found.", 403);

        var query = _auditLogRepository.QueryNoTracking()
            .Where(a => a.TenantId == tenantId.Value && !a.IsDeleted);

        if (action.HasValue)
            query = query.Where(a => a.Action == action.Value);

        if (!string.IsNullOrWhiteSpace(entityType))
            query = query.Where(a => a.EntityType == entityType);

        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId.Value);

        if (fromDate.HasValue)
            query = query.Where(a => a.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(a => a.CreatedAt <= toDate.Value);

        var totalCount = await query.CountAsync(cancellationToken);

        var logs = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<AuditLogDto>>(logs);
        var result = new PaginatedResultDto<AuditLogDto>(dtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PaginatedResultDto<AuditLogDto>>.Ok(result);
    }
}
