using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Notification;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class NotificationService : INotificationService
{
    private readonly IRepository<Notification> _notificationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public NotificationService(
        IRepository<Notification> notificationRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _notificationRepository = notificationRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PaginatedResultDto<NotificationDto>>> GetNotificationsAsync(
        int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<PaginatedResultDto<NotificationDto>>.Fail("User not authenticated.", 401);

        var query = _notificationRepository.QueryNoTracking()
            .Where(n => n.UserId == userId.Value && !n.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<NotificationDto>>(notifications);
        var result = new PaginatedResultDto<NotificationDto>(dtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PaginatedResultDto<NotificationDto>>.Ok(result);
    }

    public async Task<ApiResponse> MarkAsReadAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var notification = await _notificationRepository.GetByIdAsync(id, cancellationToken);
        if (notification == null || notification.IsDeleted)
            return ApiResponse.Fail("Notification not found.", 404);

        if (notification.UserId != _currentUser.UserId)
            return ApiResponse.Fail("Unauthorized.", 403);

        if (notification.IsRead)
            return ApiResponse.Ok("Notification already marked as read.");

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        notification.UpdatedAt = DateTime.UtcNow;

        _notificationRepository.Update(notification);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Notification marked as read.");
    }

    public async Task<ApiResponse> MarkAllAsReadAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse.Fail("User not authenticated.", 401);

        var unreadNotifications = await _notificationRepository.FindAsync(
            n => n.UserId == userId.Value && !n.IsRead && !n.IsDeleted, cancellationToken);

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            notification.UpdatedAt = DateTime.UtcNow;
        }

        _notificationRepository.UpdateRange(unreadNotifications);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("All notifications marked as read.");
    }

    public async Task<ApiResponse<int>> GetUnreadCountAsync(CancellationToken cancellationToken = default)
    {
        var userId = _currentUser.UserId;
        if (userId == null)
            return ApiResponse<int>.Fail("User not authenticated.", 401);

        var count = await _notificationRepository.CountAsync(
            n => n.UserId == userId.Value && !n.IsRead && !n.IsDeleted, cancellationToken);

        return ApiResponse<int>.Ok(count);
    }

    public async Task<ApiResponse<NotificationDto>> CreateAsync(
        Guid userId, string title, string message, NotificationType type,
        Guid? referenceId = null, CancellationToken cancellationToken = default)
    {
        var notification = new Notification
        {
            UserId = userId,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            Title = title,
            Message = message,
            Type = type,
            ReferenceId = referenceId,
            IsRead = false,
            CreatedBy = _currentUser.UserId
        };

        await _notificationRepository.AddAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<NotificationDto>(notification);
        return ApiResponse<NotificationDto>.Ok(result, "Notification created.");
    }
}
